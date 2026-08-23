package com.example.aidocumentassistant.controller;

import com.example.aidocumentassistant.dto.ApiResponse;
import com.example.aidocumentassistant.service.GeminiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    private final GeminiService geminiService;

    public HealthController(GeminiService geminiService) {
        this.geminiService = geminiService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getHealth() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("service", "RAG DOCS - Intelligent Assistant");
        health.put("timestamp", LocalDateTime.now());
        health.put("geminiConnected", geminiService.isConfigured());
        return ResponseEntity.ok(ApiResponse.ok("Service is operational", health));
    }
}
