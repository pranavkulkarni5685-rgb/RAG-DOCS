package com.example.aidocumentassistant.repository;

import com.example.aidocumentassistant.entity.Document;
import com.example.aidocumentassistant.entity.DocumentChunk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentChunkRepository extends JpaRepository<DocumentChunk, Long> {
    List<DocumentChunk> findByDocumentOrderByChunkIndexAsc(Document document);
    List<DocumentChunk> findByDocumentIdOrderByChunkIndexAsc(Long documentId);
    
    @Query("SELECT c FROM DocumentChunk c JOIN FETCH c.document d WHERE d.status = 'COMPLETED'")
    List<DocumentChunk> findAllCompletedChunksWithDocument();

    @Query("SELECT c FROM DocumentChunk c JOIN FETCH c.document d WHERE d.id IN :docIds AND d.status = 'COMPLETED'")
    List<DocumentChunk> findCompletedChunksByDocumentIds(@Param("docIds") List<Long> docIds);

    void deleteByDocument(Document document);
}
