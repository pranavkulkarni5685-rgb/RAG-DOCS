package com.example.aidocumentassistant.repository;

import com.example.aidocumentassistant.entity.Document;
import com.example.aidocumentassistant.entity.DocumentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {
    List<Document> findAllByOrderByUploadedAtDesc();
    long countByStatus(DocumentStatus status);
}
