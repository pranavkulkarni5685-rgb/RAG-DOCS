package com.example.aidocumentassistant.dto;

import com.example.aidocumentassistant.entity.DocumentChunk;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentChunkDto {
    private Long id;
    private Integer chunkIndex;
    private Integer pageNumber;
    private String chunkText;
    private Integer tokenCount;

    public static DocumentChunkDto fromEntity(DocumentChunk chunk) {
        return DocumentChunkDto.builder()
                .id(chunk.getId())
                .chunkIndex(chunk.getChunkIndex())
                .pageNumber(chunk.getPageNumber())
                .chunkText(chunk.getChunkText())
                .tokenCount(chunk.getTokenCount())
                .build();
    }
}
