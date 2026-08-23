package com.example.aidocumentassistant.service;

import com.example.aidocumentassistant.dto.DocumentDetailDto;
import com.example.aidocumentassistant.dto.DocumentResponseDto;
import com.example.aidocumentassistant.dto.DocumentChunkDto;
import com.example.aidocumentassistant.entity.Document;
import com.example.aidocumentassistant.entity.DocumentChunk;
import com.example.aidocumentassistant.entity.DocumentStatus;
import com.example.aidocumentassistant.exception.InvalidFileException;
import com.example.aidocumentassistant.exception.PdfProcessingException;
import com.example.aidocumentassistant.exception.ResourceNotFoundException;
import com.example.aidocumentassistant.repository.DocumentChunkRepository;
import com.example.aidocumentassistant.repository.DocumentRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class DocumentService {

    private static final Logger log = LoggerFactory.getLogger(DocumentService.class);

    private final DocumentRepository documentRepository;
    private final DocumentChunkRepository documentChunkRepository;
    private final PdfExtractionService pdfExtractionService;
    private final TextChunkerService textChunkerService;
    private final GeminiService geminiService;
    private final ObjectMapper objectMapper;
    private final Path uploadDirectoryPath;

    public DocumentService(
            DocumentRepository documentRepository,
            DocumentChunkRepository documentChunkRepository,
            PdfExtractionService pdfExtractionService,
            TextChunkerService textChunkerService,
            GeminiService geminiService,
            ObjectMapper objectMapper,
            @Value("${app.upload.dir:D:/ai-document-assistant/uploads}") String uploadDir) {
        this.documentRepository = documentRepository;
        this.documentChunkRepository = documentChunkRepository;
        this.pdfExtractionService = pdfExtractionService;
        this.textChunkerService = textChunkerService;
        this.geminiService = geminiService;
        this.objectMapper = objectMapper;
        this.uploadDirectoryPath = Paths.get(uploadDir).toAbsolutePath().normalize();

        try {
            Files.createDirectories(this.uploadDirectoryPath);
        } catch (IOException e) {
            log.error("Failed to initialize upload directory: {}", this.uploadDirectoryPath, e);
        }
    }

    public List<DocumentResponseDto> getAllDocuments() {
        return documentRepository.findAllByOrderByUploadedAtDesc()
                .stream()
                .map(DocumentResponseDto::fromEntity)
                .collect(Collectors.toList());
    }

    public DocumentDetailDto getDocumentById(Long id) {
        Document doc = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found with ID: " + id));

        List<DocumentChunkDto> chunkDtos = documentChunkRepository.findByDocumentOrderByChunkIndexAsc(doc)
                .stream()
                .map(DocumentChunkDto::fromEntity)
                .collect(Collectors.toList());

        return DocumentDetailDto.fromEntity(doc, chunkDtos);
    }

    public DocumentResponseDto processAndUploadPdf(MultipartFile file) {
        validatePdfFileSecurity(file);

        String originalFileName = sanitizeFileName(file.getOriginalFilename());
        String storedFileName = UUID.randomUUID().toString() + "_" + originalFileName;
        Path targetPath = this.uploadDirectoryPath.resolve(storedFileName).normalize();

        // Prevent Path Traversal
        if (!targetPath.startsWith(this.uploadDirectoryPath)) {
            throw new InvalidFileException("Security violation: Invalid file path.");
        }

        try {
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            log.error("Failed to save uploaded file: {}", originalFileName, e);
            throw new PdfProcessingException("Failed to save uploaded file: " + e.getMessage(), e);
        }

        Document document = Document.builder()
                .fileName(originalFileName)
                .storedFileName(storedFileName)
                .filePath(targetPath.toString())
                .fileSize(file.getSize())
                .status(DocumentStatus.PROCESSING)
                .pageCount(0)
                .chunkCount(0)
                .build();

        document = documentRepository.save(document);

        try {
            processDocumentContent(document, targetPath.toFile());
        } catch (Exception e) {
            log.error("Processing failed for document id {}: {}", document.getId(), e.getMessage(), e);
            document.setStatus(DocumentStatus.FAILED);
            document.setErrorMessage(e.getMessage());
            documentRepository.save(document);
            throw new PdfProcessingException("PDF processing failed: " + e.getMessage(), e);
        }

        return DocumentResponseDto.fromEntity(document);
    }

    private void processDocumentContent(Document document, File pdfFile) {
        List<PdfExtractionService.PageContent> pageContents = pdfExtractionService.extractTextByPages(pdfFile);
        document.setPageCount(pageContents.size());

        List<TextChunkerService.ChunkResult> chunkResults = textChunkerService.chunkPages(pageContents);
        document.setChunkCount(chunkResults.size());

        List<String> chunkTexts = chunkResults.stream()
                .map(TextChunkerService.ChunkResult::chunkText)
                .collect(Collectors.toList());

        List<List<Double>> embeddings = List.of();
        if (geminiService.isConfigured()) {
            try {
                embeddings = geminiService.batchGenerateEmbeddings(chunkTexts);
            } catch (Exception e) {
                log.warn("Gemini batch embedding error: {}", e.getMessage());
            }
        }

        List<DocumentChunk> entityChunks = new ArrayList<>();
        for (int i = 0; i < chunkResults.size(); i++) {
            TextChunkerService.ChunkResult cr = chunkResults.get(i);
            String embJson = null;

            if (i < embeddings.size() && embeddings.get(i) != null && !embeddings.get(i).isEmpty()) {
                try {
                    embJson = objectMapper.writeValueAsString(embeddings.get(i));
                } catch (Exception ignored) {}
            }

            DocumentChunk chunk = DocumentChunk.builder()
                    .document(document)
                    .chunkIndex(cr.chunkIndex())
                    .pageNumber(cr.pageNumber())
                    .chunkText(cr.chunkText())
                    .tokenCount(cr.tokenCount())
                    .embeddingJson(embJson)
                    .build();

            entityChunks.add(chunk);
        }

        documentChunkRepository.saveAll(entityChunks);

        document.setStatus(DocumentStatus.COMPLETED);
        document.setErrorMessage(null);
        documentRepository.save(document);
        log.info("Indexed document id {}: {} pages, {} chunks", document.getId(), document.getPageCount(), document.getChunkCount());
    }

    @Transactional
    public void deleteDocument(Long id) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found with ID: " + id));

        try {
            Path filePath = Paths.get(document.getFilePath()).normalize();
            if (filePath.startsWith(this.uploadDirectoryPath) && Files.exists(filePath)) {
                Files.delete(filePath);
            }
        } catch (Exception e) {
            log.warn("Could not remove disk file {}: {}", document.getFilePath(), e.getMessage());
        }

        documentRepository.delete(document);
    }

    private void validatePdfFileSecurity(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new InvalidFileException("Uploaded file is empty.");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !originalFilename.toLowerCase().endsWith(".pdf")) {
            throw new InvalidFileException("Security check: Only genuine PDF (.pdf) documents are permitted.");
        }

        if (file.getSize() > 50 * 1024 * 1024) {
            throw new InvalidFileException("File size exceeds 50MB limit.");
        }

        // Magic byte verification: Check for '%PDF-' header
        try (InputStream is = file.getInputStream()) {
            byte[] header = new byte[5];
            int read = is.read(header);
            if (read < 5 || !new String(header).startsWith("%PDF")) {
                throw new InvalidFileException("Security check failed: File content does not match genuine PDF binary header.");
            }
        } catch (IOException e) {
            throw new InvalidFileException("Could not verify file integrity.");
        }
    }

    private String sanitizeFileName(String fileName) {
        if (fileName == null) return "document.pdf";
        return fileName.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
