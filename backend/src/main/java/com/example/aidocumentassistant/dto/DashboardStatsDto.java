package com.example.aidocumentassistant.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardStatsDto {
    private long totalDocuments;
    private long processedDocuments;
    private long failedDocuments;
    private long totalChunks;
    private long totalChatSessions;
    private long totalQuestionsAnswered;
    private boolean geminiConfigured;
    private List<DocumentResponseDto> recentDocuments;
}
