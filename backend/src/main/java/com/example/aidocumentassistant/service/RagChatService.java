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
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
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

    public enum QueryIntent {
        DOCUMENT_WIDE_SUMMARY,
        EXAM_QUESTIONS_GENERATION,
        PAGE_BY_PAGE_EXPLANATION,
        PAGE_SPECIFIC_LOOKUP,
        DEFINITIONS_AND_CONCEPTS,
        STANDARD_CONCEPT_LOOKUP
    }

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

        // 3. Fetch candidate chunks (filtered by doc ID if specified, else all completed docs)
        List<DocumentChunk> candidateChunks;
        if (request.getDocumentIds() != null && !request.getDocumentIds().isEmpty()) {
            candidateChunks = documentChunkRepository.findCompletedChunksByDocumentIds(request.getDocumentIds());
        } else {
            candidateChunks = documentChunkRepository.findAllCompletedChunksWithDocument();
        }

        if (candidateChunks.isEmpty()) {
            String answer = "No processed PDF documents were found. Please upload a PDF document first so I can assist you based on its content.";
            ChatMessage aiMessage = persistAiMessage(session, answer, List.of());
            return buildResponse(session.getId(), aiMessage.getId(), question, answer, List.of());
        }

        // 4. Classify Query Intent
        QueryIntent intent = classifyQueryIntent(question);
        log.info("Detected query intent: {} for question: '{}'", intent, question);

        // 5. Retrieve Context Based on Intent
        RetrievalResult retrievalResult = retrieveContext(question, intent, candidateChunks);

        // 6. Formulate Tailored Grounded System Prompt
        String systemInstruction = buildSystemInstruction(intent);
        String userPrompt = String.format("DOCUMENT CONTEXT (Extracted from uploaded PDF):\n%s\n\nUSER QUESTION:\n%s",
                retrievalResult.contextText(), question);

        // 7. Generate Answer via Gemini AI
        String answer;
        if (geminiService.isConfigured()) {
            try {
                answer = geminiService.generateAnswer(systemInstruction, userPrompt);
            } catch (Exception e) {
                log.error("Gemini answer generation failed: {}", e.getMessage(), e);
                answer = "⚠️ Failed to generate answer using Gemini AI: " + e.getMessage() +
                        "\n\nPlease verify your Gemini API key and network connection in Settings.";
            }
        } else {
            answer = "Gemini API key is not configured yet. Here are the most relevant document chunks found for your query:\n\n"
                    + retrievalResult.sources().stream()
                    .map(s -> String.format("• **%s** (Page %d): %s", s.getDocumentName(), s.getPageNumber(), s.getChunkSnippet()))
                    .collect(Collectors.joining("\n\n"));
        }

        // 8. Persist AI Message & Sources
        ChatMessage aiMessage = persistAiMessage(session, answer, retrievalResult.sources());

        return buildResponse(session.getId(), aiMessage.getId(), question, answer, retrievalResult.sources());
    }

    private record RetrievalResult(String contextText, List<SourceDto> sources) {}

    private QueryIntent classifyQueryIntent(String q) {
        String queryLower = q.toLowerCase();

        // 1. Page-by-page explanation
        if (queryLower.contains("explain each page") ||
            queryLower.contains("explain every page") ||
            queryLower.contains("page by page") ||
            queryLower.contains("page-by-page") ||
            queryLower.contains("page-wise") ||
            queryLower.contains("page wise") ||
            queryLower.contains("all pages") ||
            queryLower.contains("what is present on each page") ||
            queryLower.contains("what is in each page")) {
            return QueryIntent.PAGE_BY_PAGE_EXPLANATION;
        }

        // 2. Exam questions generation
        if (queryLower.contains("2-4 mark") ||
            queryLower.contains("2 to 4 mark") ||
            queryLower.contains("2 to 4 marks") ||
            queryLower.contains("2-4 marks") ||
            queryLower.contains("important questions") ||
            queryLower.contains("exam questions") ||
            queryLower.contains("exam-oriented") ||
            queryLower.contains("question paper") ||
            queryLower.contains("practice questions") ||
            queryLower.contains("test questions") ||
            queryLower.contains("viva questions") ||
            queryLower.contains("questions and answers") ||
            queryLower.contains("q&a")) {
            return QueryIntent.EXAM_QUESTIONS_GENERATION;
        }

        // 3. Page specific lookup (e.g. "explain page 5", "page no 3", "on page 7")
        Pattern pagePattern = Pattern.compile("\\b(?:page|p\\.|pg\\.|page no|page number)\\s*(\\d+)\\b");
        if (pagePattern.matcher(queryLower).find()) {
            return QueryIntent.PAGE_SPECIFIC_LOOKUP;
        }

        // 4. Whole-document summary
        if (queryLower.contains("summarize") ||
            queryLower.contains("summary") ||
            queryLower.contains("what is explained in this pdf") ||
            queryLower.contains("what is in this pdf") ||
            queryLower.contains("what does this pdf contain") ||
            queryLower.contains("explain this pdf") ||
            queryLower.contains("overview") ||
            queryLower.contains("complete pdf") ||
            queryLower.contains("entire pdf") ||
            queryLower.contains("entire document") ||
            queryLower.contains("brief") ||
            queryLower.contains("synopsis") ||
            queryLower.contains("table of contents")) {
            return QueryIntent.DOCUMENT_WIDE_SUMMARY;
        }

        // 5. Definitions and concepts
        if (queryLower.contains("definitions") ||
            queryLower.contains("define") ||
            queryLower.contains("important terms") ||
            queryLower.contains("glossary") ||
            queryLower.contains("formulas") ||
            queryLower.contains("abbreviations")) {
            return QueryIntent.DEFINITIONS_AND_CONCEPTS;
        }

        // 6. Standard concept lookup
        return QueryIntent.STANDARD_CONCEPT_LOOKUP;
    }

    private RetrievalResult retrieveContext(String question, QueryIntent intent, List<DocumentChunk> candidateChunks) {
        StringBuilder contextBuilder = new StringBuilder();
        List<SourceDto> sources = new ArrayList<>();

        if (intent == QueryIntent.PAGE_SPECIFIC_LOOKUP) {
            // Extract targeted page numbers from query
            Set<Integer> targetPages = extractPageNumbers(question);
            List<DocumentChunk> pageChunks = candidateChunks.stream()
                    .filter(c -> targetPages.contains(c.getPageNumber()))
                    .sorted(Comparator.comparingInt(DocumentChunk::getPageNumber)
                            .thenComparingInt(DocumentChunk::getChunkIndex))
                    .toList();

            if (!pageChunks.isEmpty()) {
                for (DocumentChunk chunk : pageChunks) {
                    appendChunkToContext(contextBuilder, sources, chunk, 1.0);
                }
                return new RetrievalResult(contextBuilder.toString(), sources);
            }
        }

        if (intent == QueryIntent.DOCUMENT_WIDE_SUMMARY ||
            intent == QueryIntent.PAGE_BY_PAGE_EXPLANATION ||
            intent == QueryIntent.EXAM_QUESTIONS_GENERATION ||
            intent == QueryIntent.DEFINITIONS_AND_CONCEPTS) {

            // Sort all chunks by page number and chunk index
            List<DocumentChunk> sortedChunks = new ArrayList<>(candidateChunks);
            sortedChunks.sort(Comparator.comparingInt(DocumentChunk::getPageNumber)
                    .thenComparingInt(DocumentChunk::getChunkIndex));

            // If total chunks fit comfortably within Gemini's 1M context window (up to ~60 chunks / ~60k chars), include all
            int totalLength = sortedChunks.stream().mapToInt(c -> c.getChunkText().length()).sum();
            if (totalLength < 120000 || sortedChunks.size() <= 80) {
                for (DocumentChunk chunk : sortedChunks) {
                    appendChunkToContext(contextBuilder, sources, chunk, 0.98);
                }
                return new RetrievalResult(contextBuilder.toString(), sources);
            } else {
                // Stratified page sampling: Ensure at least one chunk per page + top keywords
                Map<Integer, List<DocumentChunk>> pageMap = sortedChunks.stream()
                        .collect(Collectors.groupingBy(DocumentChunk::getPageNumber));

                List<Integer> pageNumbers = new ArrayList<>(pageMap.keySet());
                Collections.sort(pageNumbers);

                for (int pNum : pageNumbers) {
                    List<DocumentChunk> pChunks = pageMap.get(pNum);
                    for (DocumentChunk pc : pChunks) {
                        appendChunkToContext(contextBuilder, sources, pc, 0.95);
                    }
                }
                return new RetrievalResult(contextBuilder.toString(), sources);
            }
        }

        // Standard Concept Lookup: Hybrid Dense Vector + Lexical BM25 Ranking
        List<VectorStoreService.ScoredChunk> relevantChunks = new ArrayList<>();
        if (geminiService.isConfigured()) {
            try {
                List<Double> queryEmbedding = geminiService.generateEmbedding(question);
                relevantChunks = vectorStoreService.findSimilarChunks(
                        queryEmbedding,
                        candidateChunks,
                        15, // Up to 15 chunks
                        ragConfig.getSimilarityThreshold()
                );
            } catch (Exception e) {
                log.warn("Vector search failed ({}). Using hybrid text search.", e.getMessage());
            }
        }

        // If vector search returned < 6 chunks, supplement with keyword token overlap search
        if (relevantChunks.size() < 6) {
            List<VectorStoreService.ScoredChunk> keywordMatches = fallbackTextSearch(question, candidateChunks, 15);
            Set<Long> existingChunkIds = relevantChunks.stream()
                    .map(sc -> sc.chunk().getId())
                    .collect(Collectors.toSet());

            for (VectorStoreService.ScoredChunk km : keywordMatches) {
                if (!existingChunkIds.contains(km.chunk().getId())) {
                    relevantChunks.add(km);
                    existingChunkIds.add(km.chunk().getId());
                }
            }
        }

        // Sort combined results
        relevantChunks.sort(Comparator.comparingDouble(VectorStoreService.ScoredChunk::relevanceScore).reversed());

        int limit = Math.min(15, relevantChunks.size());
        for (int i = 0; i < limit; i++) {
            VectorStoreService.ScoredChunk sc = relevantChunks.get(i);
            appendChunkToContext(contextBuilder, sources, sc.chunk(), sc.relevanceScore());
        }

        return new RetrievalResult(contextBuilder.toString(), sources);
    }

    private void appendChunkToContext(StringBuilder sb, List<SourceDto> sources, DocumentChunk chunk, double score) {
        Document doc = chunk.getDocument();
        String docName = doc != null ? doc.getFileName() : "Document";

        sb.append(String.format("--- [DOCUMENT: %s | PAGE: %d | CHUNK: %d] ---\n%s\n\n",
                docName, chunk.getPageNumber(), chunk.getChunkIndex(), chunk.getChunkText()));

        // Avoid adding duplicate sources for the exact same page
        boolean alreadyAdded = sources.stream()
                .anyMatch(s -> s.getPageNumber() == chunk.getPageNumber() && s.getDocumentName().equals(docName));

        if (!alreadyAdded) {
            sources.add(SourceDto.builder()
                    .documentId(doc != null ? doc.getId() : null)
                    .documentName(docName)
                    .pageNumber(chunk.getPageNumber())
                    .relevanceScore(Math.round(score * 100.0) / 100.0)
                    .chunkSnippet(truncateSnippet(chunk.getChunkText(), 240))
                    .build());
        }
    }

    private Set<Integer> extractPageNumbers(String text) {
        Set<Integer> pages = new HashSet<>();
        Pattern p = Pattern.compile("\\b(?:page|p\\.|pg\\.|page no|page number)\\s*(\\d+)\\b", Pattern.CASE_INSENSITIVE);
        Matcher m = p.matcher(text);
        while (m.find()) {
            try {
                pages.add(Integer.parseInt(m.group(1)));
            } catch (NumberFormatException ignored) {}
        }
        return pages;
    }

    private String buildSystemInstruction(QueryIntent intent) {
        return switch (intent) {
            case EXAM_QUESTIONS_GENERATION -> """
                    You are an expert academic professor and exam evaluator.
                    Your goal is to formulate high-yield, exam-oriented questions along with their model answers based STRICTLY and ONLY on the provided document context.
                    
                    STRUCTURE & GUIDELINES:
                    1. Divide the output into:
                       - **Section A: Short Answer Questions (2 Marks)**
                         - Provide 4-6 concise questions focusing on key definitions, core concepts, formulas, or abbreviations.
                         - Give a clear 2-3 sentence answer for each, citing the exact page number (e.g. [Page 3]).
                       - **Section B: Medium & Analytical Questions (4 Marks)**
                         - Provide 4-6 detailed questions requiring step-by-step explanations, comparative differences, process flows, or algorithms.
                         - Give a structured, comprehensive answer with bullet points or numbered steps, citing exact page numbers.
                    2. Cover all major topics and chapters present in the document.
                    3. Do NOT make up any questions or answers not supported by the document text.
                    """;

            case PAGE_BY_PAGE_EXPLANATION -> """
                    You are an expert educational tutor.
                    The user has asked for a page-by-page explanation of the uploaded document.
                    
                    STRUCTURE & GUIDELINES:
                    Go through every single page present in the context in sequential order (Page 1, Page 2, Page 3...) and produce:
                    
                    ### 📄 Page [X]: [Main Topic / Section Title]
                    - **Key Concepts:** [2-3 bullet points of important definitions, principles, or formulas on this page]
                    - **Detailed Explanation:** [Clear, comprehensive 3-5 sentence explanation of the topics covered on this page]
                    
                    Ensure every page present in the document context is covered thoroughly without skipping any page.
                    """;

            case DOCUMENT_WIDE_SUMMARY -> """
                    You are an expert document research analyst.
                    Provide a comprehensive, well-structured executive summary of the entire document based on the provided text.
                    
                    STRUCTURE & GUIDELINES:
                    1. **Overview & Purpose**: What this document is about, its main domain, and objective.
                    2. **Core Concepts & Chapters**: Step-by-step breakdown of the major themes and subjects discussed across the pages.
                    3. **Key Methodologies, Principles & Formulas**: Important rules, steps, diagrams, or frameworks detailed in the text.
                    4. **Key Takeaways**: Concise summary of the most critical points.
                    Always ground every point in the uploaded text and cite relevant page numbers.
                    """;

            case DEFINITIONS_AND_CONCEPTS -> """
                    You are a precise technical glossary and concept extractor.
                    Extract and list all important terms, definitions, formulas, and abbreviations found across the document.
                    
                    STRUCTURE:
                    Format each item as:
                    - **[Term / Concept Name]** ([Page X]): Clear, accurate definition as explained in the document.
                    Group related terms by topic or chapter.
                    """;

            case PAGE_SPECIFIC_LOOKUP, STANDARD_CONCEPT_LOOKUP -> """
                    You are "RAG DOCS Assistant", a precise, factual, professional AI assistant using Retrieval-Augmented Generation.
                    
                    CRITICAL INSTRUCTIONS:
                    1. Answer the user's question accurately using ONLY the provided document context snippets.
                    2. If the answer cannot be found or deduced directly from the provided context, state clearly: "This information is not available in the uploaded document."
                    3. Cite the relevant page numbers (e.g., [Page X]) for all key statements.
                    4. Keep the answer structured, well-formatted (use bullet points, tables, or markdown where appropriate), clear, and professional.
                    5. Do NOT hallucinate or assume facts beyond what is in the document.
                    """;
        };
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
                double score = Math.min(0.95, 0.35 + ((double) matches / Math.max(1, keywords.length)) * 0.55);
                results.add(new VectorStoreService.ScoredChunk(chunk, score));
            }
        }

        results.sort((a, b) -> Double.compare(b.relevanceScore(), a.relevanceScore()));
        return results.subList(0, Math.min(topK, results.size()));
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
