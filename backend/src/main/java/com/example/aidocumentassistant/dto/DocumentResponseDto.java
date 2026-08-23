package com.example.aidocumentassistant.dto;

import com.example.aidocumentassistant.entity.Document;
import com.example.aidocumentassistant.entity.DocumentStatus;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentResponseDto {
    private Long id;
    private String fileName;
    private Long fileSize;
    private Integer pageCount;
    private Integer chunkCount;
    private DocumentStatus status;
    private String errorMessage;
    private LocalDateTime uploadedAt;

    public static DocumentResponseDto fromEntity(Document doc) {
        return DocumentResponseDto.builder()
                .id(doc.getId())
                .fileName(doc.getFileName())
                .fileSize(doc.getFileSize())
                .pageCount(doc.getPageCount())
                .chunkCount(doc.getChunkCount())
                .status(doc.getStatus())
                .errorMessage(doc.getErrorMessage())
                .uploadedAt(doc.getUploadedAt())
                .build();
    }
}
