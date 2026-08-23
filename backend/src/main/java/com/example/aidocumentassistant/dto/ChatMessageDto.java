package com.example.aidocumentassistant.dto;

import com.example.aidocumentassistant.entity.ChatMessage;
import com.example.aidocumentassistant.entity.MessageRole;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessageDto {
    private Long id;
    private MessageRole role;
    private String message;
    private List<SourceDto> sources;
    private LocalDateTime createdAt;

    public static ChatMessageDto fromEntity(ChatMessage entity) {
        return ChatMessageDto.builder()
                .id(entity.getId())
                .role(entity.getRole())
                .message(entity.getMessage())
                .createdAt(entity.getCreatedAt())
                .sources(entity.getSources() != null ? 
                        entity.getSources().stream().map(SourceDto::fromEntity).collect(Collectors.toList()) : 
                        List.of())
                .build();
    }
}
