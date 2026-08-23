package com.example.aidocumentassistant.dto;

import com.example.aidocumentassistant.entity.ChatMessageSource;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SourceDto {
    private Long documentId;
    private String documentName;
    private Integer pageNumber;
    private Double relevanceScore;
    private String chunkSnippet;

    public static SourceDto fromEntity(ChatMessageSource source) {
        return SourceDto.builder()
                .documentId(source.getDocumentId())
                .documentName(source.getDocumentName())
                .pageNumber(source.getPageNumber())
                .relevanceScore(source.getRelevanceScore())
                .chunkSnippet(source.getChunkSnippet())
                .build();
    }
}
