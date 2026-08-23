package com.example.aidocumentassistant.dto;

import com.example.aidocumentassistant.entity.ChatSession;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatSessionDto {
    private Long id;
    private String title;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<ChatMessageDto> messages;
    private Integer messageCount;

    public static ChatSessionDto fromEntity(ChatSession session, boolean includeMessages) {
        return ChatSessionDto.builder()
                .id(session.getId())
                .title(session.getTitle())
                .createdAt(session.getCreatedAt())
                .updatedAt(session.getUpdatedAt())
                .messageCount(session.getMessages() != null ? session.getMessages().size() : 0)
                .messages(includeMessages && session.getMessages() != null ?
                        session.getMessages().stream().map(ChatMessageDto::fromEntity).collect(Collectors.toList()) :
                        null)
                .build();
    }
}
