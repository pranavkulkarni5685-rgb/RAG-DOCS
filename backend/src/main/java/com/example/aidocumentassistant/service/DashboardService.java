package com.example.aidocumentassistant.service;

import com.example.aidocumentassistant.dto.DashboardStatsDto;
import com.example.aidocumentassistant.dto.DocumentResponseDto;
import com.example.aidocumentassistant.entity.DocumentStatus;
import com.example.aidocumentassistant.repository.ChatMessageRepository;
import com.example.aidocumentassistant.repository.ChatSessionRepository;
import com.example.aidocumentassistant.repository.DocumentChunkRepository;
import com.example.aidocumentassistant.repository.DocumentRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final DocumentRepository documentRepository;
    private final DocumentChunkRepository documentChunkRepository;
    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final GeminiService geminiService;

    public DashboardService(
            DocumentRepository documentRepository,
            DocumentChunkRepository documentChunkRepository,
            ChatSessionRepository chatSessionRepository,
            ChatMessageRepository chatMessageRepository,
            GeminiService geminiService) {
        this.documentRepository = documentRepository;
        this.documentChunkRepository = documentChunkRepository;
        this.chatSessionRepository = chatSessionRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.geminiService = geminiService;
    }

    public DashboardStatsDto getDashboardStats() {
        long totalDocs = documentRepository.count();
        long completedDocs = documentRepository.countByStatus(DocumentStatus.COMPLETED);
        long failedDocs = documentRepository.countByStatus(DocumentStatus.FAILED);
        long totalChunks = documentChunkRepository.count();
        long totalSessions = chatSessionRepository.count();
        long totalMessages = chatMessageRepository.count();

        List<DocumentResponseDto> recentDocs = documentRepository.findAllByOrderByUploadedAtDesc()
                .stream()
                .limit(5)
                .map(DocumentResponseDto::fromEntity)
                .collect(Collectors.toList());

        return DashboardStatsDto.builder()
                .totalDocuments(totalDocs)
                .processedDocuments(completedDocs)
                .failedDocuments(failedDocs)
                .totalChunks(totalChunks)
                .totalChatSessions(totalSessions)
                .totalQuestionsAnswered(totalMessages / 2)
                .geminiConfigured(geminiService.isConfigured())
                .recentDocuments(recentDocs)
                .build();
    }
}
