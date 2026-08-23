package com.example.aidocumentassistant.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatResponseDto {
    private Long sessionId;
    private Long messageId;
    private String question;
    private String answer;
    private List<SourceDto> sources;
    private LocalDateTime timestamp;
}
