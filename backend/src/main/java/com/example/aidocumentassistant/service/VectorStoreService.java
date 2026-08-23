package com.example.aidocumentassistant.service;

import com.example.aidocumentassistant.config.RagConfig;
import com.example.aidocumentassistant.entity.DocumentChunk;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class VectorStoreService {

    private static final Logger log = LoggerFactory.getLogger(VectorStoreService.class);

    private final RagConfig ragConfig;
    private final ObjectMapper objectMapper;

    public VectorStoreService(RagConfig ragConfig, ObjectMapper objectMapper) {
        this.ragConfig = ragConfig;
        this.objectMapper = objectMapper;
    }

    public record ScoredChunk(
            DocumentChunk chunk,
            double relevanceScore
    ) {}

    public List<ScoredChunk> findSimilarChunks(List<Double> queryVector, List<DocumentChunk> candidateChunks, int topK, double minThreshold) {
        if (queryVector == null || queryVector.isEmpty() || candidateChunks == null || candidateChunks.isEmpty()) {
            return List.of();
        }

        List<ScoredChunk> scoredList = new ArrayList<>();

        for (DocumentChunk chunk : candidateChunks) {
            String embeddingJson = chunk.getEmbeddingJson();
            if (embeddingJson == null || embeddingJson.isBlank()) continue;

            try {
                List<Double> chunkVector = objectMapper.readValue(embeddingJson, new TypeReference<List<Double>>() {});
                if (chunkVector.size() != queryVector.size()) {
                    log.warn("Vector dimension mismatch: query={}, chunk={}", queryVector.size(), chunkVector.size());
                    continue;
                }

                double similarity = computeCosineSimilarity(queryVector, chunkVector);
                if (similarity >= minThreshold) {
                    scoredList.add(new ScoredChunk(chunk, similarity));
                }
            } catch (Exception e) {
                log.warn("Failed to parse vector embedding for chunk id {}: {}", chunk.getId(), e.getMessage());
            }
        }

        // Sort descending by relevance score
        scoredList.sort(Comparator.comparingDouble(ScoredChunk::relevanceScore).reversed());

        // Limit to topK
        int limit = Math.min(topK > 0 ? topK : ragConfig.getTopK(), scoredList.size());
        return scoredList.subList(0, limit);
    }

    public double computeCosineSimilarity(List<Double> vectorA, List<Double> vectorB) {
        if (vectorA.size() != vectorB.size() || vectorA.isEmpty()) {
            return 0.0;
        }

        double dotProduct = 0.0;
        double normA = 0.0;
        double normB = 0.0;

        for (int i = 0; i < vectorA.size(); i++) {
            double a = vectorA.get(i);
            double b = vectorB.get(i);
            dotProduct += a * b;
            normA += a * a;
            normB += b * b;
        }

        if (normA <= 0.0 || normB <= 0.0) {
            return 0.0;
        }

        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}
