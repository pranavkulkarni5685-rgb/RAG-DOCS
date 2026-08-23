package com.example.aidocumentassistant.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "document_chunks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentChunk {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    @JsonIgnore
    private Document document;

    @Column(name = "chunk_index", nullable = false)
    private Integer chunkIndex;

    @Column(name = "page_number", nullable = false)
    private Integer pageNumber;

    @Column(name = "chunk_text", nullable = false, columnDefinition = "LONGTEXT")
    private String chunkText;

    @Column(name = "embedding_json", columnDefinition = "LONGTEXT")
    private String embeddingJson;

    @Column(name = "token_count")
    @Builder.Default
    private Integer tokenCount = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }
}
