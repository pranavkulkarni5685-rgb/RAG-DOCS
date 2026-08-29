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
        int chunkSize = ragConfig.getChunkSize() > 0 ? ragConfig.getChunkSize() : 1000;
        int chunkOverlap = ragConfig.getChunkOverlap() >= 0 ? ragConfig.getChunkOverlap() : 200;

        int overallChunkIndex = 0;

        for (PdfExtractionService.PageContent page : pages) {
            String text = page.text();
            if (text == null || text.isBlank()) continue;

            if (text.length() <= chunkSize) {
                // Whole page fits in one high-context chunk
                chunks.add(new ChunkResult(
                        overallChunkIndex++,
                        page.pageNumber(),
                        text,
                        estimateTokens(text)
                ));
            } else {
                // Sliding window chunking with paragraph and sentence boundary preservation
                int start = 0;
                while (start < text.length()) {
                    int end = Math.min(start + chunkSize, text.length());

                    // If not at the end of text, try to break at a sentence boundary or paragraph boundary
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

                    // Advance with overlap
                    start = Math.max(start + 1, end - chunkOverlap);
                }
            }
        }

        log.info("Created {} high-coherence chunks from {} pages (ChunkSize: {}, Overlap: {})",
                chunks.size(), pages.size(), chunkSize, chunkOverlap);
        return chunks;
    }

    private int findBreakPoint(String text, int start, int end) {
        // 1. Try paragraph break (double newline)
        int pBreak = text.lastIndexOf("\n\n", end);
        if (pBreak > start) return pBreak + 2;

        // 2. Try single newline break
        int nlBreak = text.lastIndexOf('\n', end);
        if (nlBreak > start + (end - start) * 2 / 3) return nlBreak + 1;

        // 3. Try sentence break (., ?, !)
        for (int i = end; i > start + (end - start) / 2; i--) {
            char c = text.charAt(i - 1);
            if ((c == '.' || c == '?' || c == '!') && (i == text.length() || Character.isWhitespace(text.charAt(i)))) {
                return i;
            }
        }

        // 4. Try whitespace break
        int spaceBreak = text.lastIndexOf(' ', end);
        if (spaceBreak > start) return spaceBreak + 1;

        return end;
    }

    private int estimateTokens(String text) {
        if (text == null || text.isBlank()) return 0;
        return Math.max(1, text.length() / 4);
    }
}
