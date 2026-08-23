package com.example.aidocumentassistant.service;

import com.example.aidocumentassistant.exception.PdfProcessingException;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Service
public class PdfExtractionService {

    private static final Logger log = LoggerFactory.getLogger(PdfExtractionService.class);

    public record PageContent(int pageNumber, String text) {}

    public List<PageContent> extractTextByPages(File pdfFile) {
        log.info("Extracting text from PDF: {}", pdfFile.getName());
        List<PageContent> pages = new ArrayList<>();

        try (PDDocument document = Loader.loadPDF(pdfFile)) {
            int totalPages = document.getNumberOfPages();
            log.info("Total pages in PDF {}: {}", pdfFile.getName(), totalPages);

            PDFTextStripper stripper = new PDFTextStripper();

            for (int page = 1; page <= totalPages; page++) {
                stripper.setStartPage(page);
                stripper.setEndPage(page);
                String rawText = stripper.getText(document);
                String cleanText = sanitizeText(rawText);

                if (!cleanText.isBlank()) {
                    pages.add(new PageContent(page, cleanText));
                } else {
                    // Empty or image-only page
                    log.debug("Page {} in {} is blank or has no extractable text", page, pdfFile.getName());
                }
            }
        } catch (IOException e) {
            log.error("Failed to read PDF file: {}", pdfFile.getAbsolutePath(), e);
            throw new PdfProcessingException("Unable to read or parse PDF file: " + e.getMessage(), e);
        }

        if (pages.isEmpty()) {
            throw new PdfProcessingException("No extractable text found in PDF. The document might be scanned/image-only or password protected.");
        }

        return pages;
    }

    private String sanitizeText(String text) {
        if (text == null) return "";
        // Remove null characters, normalize line breaks and excess whitespaces
        return text.replace("\u0000", "")
                   .replaceAll("[\\r\\t]+", " ")
                   .replaceAll(" +", " ")
                   .replaceAll("\\n{3,}", "\\n\\n")
                   .trim();
    }
}
