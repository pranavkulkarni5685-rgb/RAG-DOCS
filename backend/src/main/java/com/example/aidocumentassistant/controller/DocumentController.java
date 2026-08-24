package com.example.aidocumentassistant.controller;

import com.example.aidocumentassistant.dto.ApiResponse;
import com.example.aidocumentassistant.dto.DocumentDetailDto;
import com.example.aidocumentassistant.dto.DocumentResponseDto;
import com.example.aidocumentassistant.service.DocumentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping({"/api/documents", "/documents"})
public class DocumentController {

    private static final Logger log = LoggerFactory.getLogger(DocumentController.class);
    private final DocumentService documentService;

    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<DocumentResponseDto>> uploadDocument(@RequestParam("file") MultipartFile file) {
        log.info("Received PDF upload request: {}", file.getOriginalFilename());
        DocumentResponseDto result = documentService.processAndUploadPdf(file);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("PDF uploaded and processed successfully", result));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<DocumentResponseDto>>> getAllDocuments() {
        List<DocumentResponseDto> documents = documentService.getAllDocuments();
        return ResponseEntity.ok(ApiResponse.ok("Retrieved documents", documents));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DocumentDetailDto>> getDocumentById(@PathVariable Long id) {
        DocumentDetailDto detail = documentService.getDocumentById(id);
        return ResponseEntity.ok(ApiResponse.ok("Retrieved document details", detail));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteDocument(@PathVariable Long id) {
        documentService.deleteDocument(id);
        return ResponseEntity.ok(ApiResponse.ok("Document deleted successfully", null));
    }
}
