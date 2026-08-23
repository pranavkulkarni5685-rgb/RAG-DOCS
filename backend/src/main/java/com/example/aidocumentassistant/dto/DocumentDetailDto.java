package com.example.aidocumentassistant.dto;

import com.example.aidocumentassistant.entity.Document;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentDetailDto {
    private Long id;
    private String fileName;
    private Long fileSize;
    private Integer pageCount;
    private Integer chunkCount;
    private String status;
    private String errorMessage;
    private LocalDateTime uploadedAt;
    private List<DocumentChunkDto> chunks;

    public static DocumentDetailDto fromEntity(Document doc, List<DocumentChunkDto> chunks) {
        return DocumentDetailDto.builder()
                .id(doc.getId())
                .fileName(doc.getFileName())
                .fileSize(doc.getFileSize())
                .pageCount(doc.getPageCount())
                .chunkCount(doc.getChunkCount())
                .status(doc.getStatus().name())
                .errorMessage(doc.getErrorMessage())
                .uploadedAt(doc.getUploadedAt())
                .chunks(chunks)
                .build();
    }
}
