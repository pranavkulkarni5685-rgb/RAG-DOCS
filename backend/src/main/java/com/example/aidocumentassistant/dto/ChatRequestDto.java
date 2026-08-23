package com.example.aidocumentassistant.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatRequestDto {
    private Long sessionId;

    @NotBlank(message = "Question cannot be empty")
    private String question;

    // Optional: filter vector search to specific documents
    private List<Long> documentIds;
}
