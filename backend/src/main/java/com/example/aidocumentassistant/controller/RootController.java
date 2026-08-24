package com.example.aidocumentassistant.controller;

import com.example.aidocumentassistant.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
public class RootController {

    @GetMapping("/")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getRoot() {
        Map<String, Object> info = new HashMap<>();
        info.put("application", "RAG DOCS - Intelligent Document Assistant");
        info.put("status", "ONLINE");
        info.put("frontendUrl", "http://localhost:5173");
        info.put("healthEndpoint", "/api/health");
        info.put("documentsEndpoint", "/api/documents");
        info.put("chatEndpoint", "/api/chat");
        info.put("dashboardEndpoint", "/api/dashboard/stats");
        info.put("message", "Welcome to RAG DOCS Backend API. Access the interactive UI at http://localhost:5173");
        return ResponseEntity.ok(ApiResponse.ok("RAG DOCS Backend is operational", info));
    }
}
