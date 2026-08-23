package com.example.aidocumentassistant.service;

import com.example.aidocumentassistant.config.RagConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class TextChunkerService {

    private static final Logger log = LoggerFactory.getLogger(TextChunkerService.class);
    private final RagConfig ragConfig;

    public TextChunkerService(RagConfig ragConfig) {
        this.ragConfig = ragConfig;
    }

    public record ChunkResult(int chunkIndex, int pageNumber, String chunkText, int tokenCount) {}

    public List<ChunkResult> chunkPages(List<PdfExtractionService.PageContent> pages) {
        List<ChunkResult> chunks = new ArrayList<>();
        int chunkSize = ragConfig.getChunkSize();
        int chunkOverlap = ragConfig.getChunkOverlap();

        int overallChunkIndex = 0;

        for (PdfExtractionService.PageContent page : pages) {
            String text = page.text();
            if (text == null || text.isBlank()) continue;

            if (text.length() <= chunkSize) {
                // Whole page fits in one chunk
                chunks.add(new ChunkResult(
                        overallChunkIndex++,
                        page.pageNumber(),
                        text,
                        estimateTokens(text)
                ));
            } else {
                // Sliding window chunking with sentence/paragraph awareness
                int start = 0;
                while (start < text.length()) {
                    int end = Math.min(start + chunkSize, text.length());

                    // If not at the end of text, try to break at a sentence boundary or word boundary
                    if (end < text.length()) {
                        int breakPoint = findBreakPoint(text, start, end);
                        if (breakPoint > start + (chunkSize / 2)) {
                            end = breakPoint;
                        }
                    }

                    String chunkText = text.substring(start, end).trim();
                    if (!chunkText.isBlank()) {
                        chunks.add(new ChunkResult(
                                overallChunkIndex++,
                                page.pageNumber(),
                                chunkText,
                                estimateTokens(chunkText)
                        ));
                    }

                    if (end >= text.length()) {
                        break;
                    }

                    // Move forward by (chunkSize - overlap)
                    start = Math.max(start + 1, end - chunkOverlap);
                }
            }
        }

        log.info("Created {} chunks from {} pages", chunks.size(), pages.size());
        return chunks;
    }

    private int findBreakPoint(String text, int start, int end) {
        // Try paragraph break
        int pBreak = text.lastIndexOf("\n\n", end);
        if (pBreak > start) return pBreak + 2;

        // Try sentence break (., ?, !)
        for (int i = end; i > start + (end - start) / 2; i--) {
            char c = text.charAt(i - 1);
            if ((c == '.' || c == '?' || c == '!') && (i == text.length() || Character.isWhitespace(text.charAt(i)))) {
                return i;
            }
        }

        // Try whitespace break
        int spaceBreak = text.lastIndexOf(' ', end);
        if (spaceBreak > start) return spaceBreak + 1;

        return end;
    }

    private int estimateTokens(String text) {
        if (text == null || text.isBlank()) return 0;
        // Approximation: 1 token is roughly 4 characters in English
        return Math.max(1, text.length() / 4);
    }
}
