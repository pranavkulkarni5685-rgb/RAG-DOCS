package com.example.aidocumentassistant.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "chat_message_sources")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessageSource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "message_id", nullable = false)
    @JsonIgnore
    private ChatMessage chatMessage;

    @Column(name = "document_id")
    private Long documentId;

    @Column(name = "document_name", nullable = false)
    private String documentName;

    @Column(name = "page_number", nullable = false)
    private Integer pageNumber;

    @Column(name = "relevance_score", nullable = false)
    private Double relevanceScore;

    @Column(name = "chunk_snippet", columnDefinition = "TEXT")
    private String chunkSnippet;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }
}
