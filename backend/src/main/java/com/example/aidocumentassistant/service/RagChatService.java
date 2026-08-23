package com.example.aidocumentassistant.service;

import com.example.aidocumentassistant.config.RagConfig;
import com.example.aidocumentassistant.dto.ChatRequestDto;
import com.example.aidocumentassistant.dto.ChatResponseDto;
import com.example.aidocumentassistant.dto.ChatSessionDto;
import com.example.aidocumentassistant.dto.SourceDto;
import com.example.aidocumentassistant.entity.*;
import com.example.aidocumentassistant.exception.ResourceNotFoundException;
import com.example.aidocumentassistant.repository.ChatMessageRepository;
import com.example.aidocumentassistant.repository.ChatMessageSourceRepository;
import com.example.aidocumentassistant.repository.ChatSessionRepository;
import com.example.aidocumentassistant.repository.DocumentChunkRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class RagChatService {

    private static final Logger log = LoggerFactory.getLogger(RagChatService.class);

    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatMessageSourceRepository chatMessageSourceRepository;
    private final DocumentChunkRepository documentChunkRepository;
    private final GeminiService geminiService;
    private final VectorStoreService vectorStoreService;
    private final RagConfig ragConfig;

    public RagChatService(
            ChatSessionRepository chatSessionRepository,
            ChatMessageRepository chatMessageRepository,
            ChatMessageSourceRepository chatMessageSourceRepository,
            DocumentChunkRepository documentChunkRepository,
            GeminiService geminiService,
            VectorStoreService vectorStoreService,
            RagConfig ragConfig) {
        this.chatSessionRepository = chatSessionRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.chatMessageSourceRepository = chatMessageSourceRepository;
        this.documentChunkRepository = documentChunkRepository;
        this.geminiService = geminiService;
        this.vectorStoreService = vectorStoreService;
        this.ragConfig = ragConfig;
    }

    @Transactional
    public ChatResponseDto processChat(ChatRequestDto request) {
        String question = request.getQuestion().trim();
        log.info("Processing RAG question: '{}' (Session: {})", question, request.getSessionId());

        // 1. Get or create Chat Session
        ChatSession session;
        if (request.getSessionId() != null && request.getSessionId() > 0) {
            session = chatSessionRepository.findById(request.getSessionId())
                    .orElseGet(() -> createNewSession(question));
        } else {
            session = createNewSession(question);
        }

        // 2. Persist User Message
        ChatMessage userMessage = ChatMessage.builder()
                .session(session)
                .role(MessageRole.USER)
                .message(question)
                .build();
        chatMessageRepository.save(userMessage);

        // 3. Fetch candidate chunks
        List<DocumentChunk> candidateChunks;
        if (request.getDocumentIds() != null && !request.getDocumentIds().isEmpty()) {
            candidateChunks = documentChunkRepository.findCompletedChunksByDocumentIds(request.getDocumentIds());
        } else {
            candidateChunks = documentChunkRepository.findAllCompletedChunksWithDocument();
        }

        if (candidateChunks.isEmpty()) {
            String answer = "No processed PDF documents were found in the system. Please upload a PDF document first so I can assist you based on its content.";
            ChatMessage aiMessage = persistAiMessage(session, answer, List.of());
            return buildResponse(session.getId(), aiMessage.getId(), question, answer, List.of());
        }

        // 4. Generate query embedding and perform Vector Similarity Search
        List<VectorStoreService.ScoredChunk> relevantChunks = List.of();
        if (geminiService.isConfigured()) {
            try {
                List<Double> queryEmbedding = geminiService.generateEmbedding(question);
                relevantChunks = vectorStoreService.findSimilarChunks(
                        queryEmbedding,
                        candidateChunks,
                        ragConfig.getTopK(),
                        ragConfig.getSimilarityThreshold()
                );
            } catch (Exception e) {
                log.warn("Vector search embedding failed: {}. Attempting fallback keyword search.", e.getMessage());
            }
        }

        // Fallback: If vector search returned 0 matches or embedding service unavailable, do token overlap ranking
        if (relevantChunks.isEmpty()) {
            relevantChunks = fallbackTextSearch(question, candidateChunks, ragConfig.getTopK());
        }

        // 5. Build Grounded Context & System Prompt
        String answer;
        List<SourceDto> sources = new ArrayList<>();

        if (relevantChunks.isEmpty()) {
            answer = "I couldn't find this information in the uploaded documents. Please try rephrasing your question or uploading relevant documents.";
        } else {
            StringBuilder contextBuilder = new StringBuilder();
            for (VectorStoreService.ScoredChunk sc : relevantChunks) {
                DocumentChunk chunk = sc.chunk();
                Document doc = chunk.getDocument();
                String docName = doc != null ? doc.getFileName() : "Document";

                contextBuilder.append(String.format("--- SOURCE: %s (Page %d, Relevance Score: %.2f) ---\n%s\n\n",
                        docName, chunk.getPageNumber(), sc.relevanceScore(), chunk.getChunkText()));

                sources.add(SourceDto.builder()
                        .documentId(doc != null ? doc.getId() : null)
                        .documentName(docName)
                        .pageNumber(chunk.getPageNumber())
                        .relevanceScore(Math.round(sc.relevanceScore() * 100.0) / 100.0)
                        .chunkSnippet(truncateSnippet(chunk.getChunkText(), 250))
                        .build());
            }

            String systemInstruction = """
                    You are "AI Document Assistant", a precise, factual, professional AI assistant using Retrieval-Augmented Generation (RAG).
                    
                    CRITICAL INSTRUCTIONS:
                    1. Answer the user's question using ONLY the provided document context snippets.
                    2. If the answer cannot be found or deduced directly from the provided context, state clearly: "I couldn't find this information in the uploaded documents."
                    3. Do NOT fabricate, assume, or hallucinate facts beyond the text provided.
                    4. Clearly cite key facts when explaining.
                    5. Keep the answer structured, well-formatted (use bullet points or markdown if helpful), concise, and professional.
                    """;

            String userPrompt = String.format("DOCUMENT CONTEXT:\n%s\nUSER QUESTION:\n%s", contextBuilder, question);

            if (geminiService.isConfigured()) {
                answer = geminiService.generateAnswer(systemInstruction, userPrompt);
            } else {
                answer = "Gemini API key is not configured yet. Here are the most relevant document chunks found for your query:\n\n"
                        + relevantChunks.stream()
                        .map(sc -> String.format("• **%s** (Page %d): %s", sc.chunk().getDocument().getFileName(), sc.chunk().getPageNumber(), sc.chunk().getChunkText()))
                        .collect(Collectors.joining("\n\n"));
            }
        }

        // 6. Persist AI Message & Sources
        ChatMessage aiMessage = persistAiMessage(session, answer, sources);

        return buildResponse(session.getId(), aiMessage.getId(), question, answer, sources);
    }

    private ChatSession createNewSession(String initialQuestion) {
        String title = initialQuestion.length() > 45 ? initialQuestion.substring(0, 42) + "..." : initialQuestion;
        ChatSession session = ChatSession.builder()
                .title(title)
                .build();
        return chatSessionRepository.save(session);
    }

    private ChatMessage persistAiMessage(ChatSession session, String answer, List<SourceDto> sources) {
        ChatMessage message = ChatMessage.builder()
                .session(session)
                .role(MessageRole.ASSISTANT)
                .message(answer)
                .build();
        message = chatMessageRepository.save(message);

        if (sources != null && !sources.isEmpty()) {
            List<ChatMessageSource> sourceEntities = new ArrayList<>();
            for (SourceDto s : sources) {
                ChatMessageSource src = ChatMessageSource.builder()
                        .chatMessage(message)
                        .documentId(s.getDocumentId())
                        .documentName(s.getDocumentName())
                        .pageNumber(s.getPageNumber())
                        .relevanceScore(s.getRelevanceScore())
                        .chunkSnippet(s.getChunkSnippet())
                        .build();
                sourceEntities.add(src);
            }
            chatMessageSourceRepository.saveAll(sourceEntities);
        }

        return message;
    }

    private ChatResponseDto buildResponse(Long sessionId, Long messageId, String question, String answer, List<SourceDto> sources) {
        return ChatResponseDto.builder()
                .sessionId(sessionId)
                .messageId(messageId)
                .question(question)
                .answer(answer)
                .sources(sources)
                .timestamp(LocalDateTime.now())
                .build();
    }

    private List<VectorStoreService.ScoredChunk> fallbackTextSearch(String query, List<DocumentChunk> chunks, int topK) {
        String[] keywords = query.toLowerCase().split("\\W+");
        List<VectorStoreService.ScoredChunk> results = new ArrayList<>();

        for (DocumentChunk chunk : chunks) {
            String text = chunk.getChunkText().toLowerCase();
            int matches = 0;
            for (String kw : keywords) {
                if (kw.length() > 2 && text.contains(kw)) {
                    matches++;
                }
            }
            if (matches > 0) {
                double score = Math.min(0.95, 0.40 + ((double) matches / keywords.length) * 0.50);
                results.add(new VectorStoreService.ScoredChunk(chunk, score));
            }
        }

        results.sort((a, b) -> Double.compare(b.relevanceScore(), a.relevanceScore()));
        return results.subList(0, Math.min(topK, results.size()));
    }

    private String truncateSnippet(String text, int maxLength) {
        if (text == null) return "";
        if (text.length() <= maxLength) return text;
        return text.substring(0, maxLength).trim() + "...";
    }

    public List<ChatSessionDto> getAllSessions() {
        return chatSessionRepository.findAllByOrderByUpdatedAtDesc()
                .stream()
                .map(s -> ChatSessionDto.fromEntity(s, false))
                .collect(Collectors.toList());
    }

    public ChatSessionDto getSessionById(Long sessionId) {
        ChatSession session = chatSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat session not found with ID: " + sessionId));
        return ChatSessionDto.fromEntity(session, true);
    }

    public ChatSessionDto createEmptySession(String title) {
        ChatSession session = ChatSession.builder()
                .title(title != null && !title.isBlank() ? title : "New Chat")
                .build();
        session = chatSessionRepository.save(session);
        return ChatSessionDto.fromEntity(session, false);
    }

    @Transactional
    public void deleteSession(Long sessionId) {
        ChatSession session = chatSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat session not found with ID: " + sessionId));
        chatSessionRepository.delete(session);
    }
}
