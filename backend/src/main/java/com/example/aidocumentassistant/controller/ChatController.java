package com.example.aidocumentassistant.controller;

import com.example.aidocumentassistant.dto.ApiResponse;
import com.example.aidocumentassistant.dto.ChatRequestDto;
import com.example.aidocumentassistant.dto.ChatResponseDto;
import com.example.aidocumentassistant.dto.ChatSessionDto;
import com.example.aidocumentassistant.service.RagChatService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/chat", "/chat"})
public class ChatController {

    private static final Logger log = LoggerFactory.getLogger(ChatController.class);
    private final RagChatService ragChatService;

    public ChatController(RagChatService ragChatService) {
        this.ragChatService = ragChatService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ChatResponseDto>> sendChatMessage(@Valid @RequestBody ChatRequestDto request) {
        ChatResponseDto response = ragChatService.processChat(request);
        return ResponseEntity.ok(ApiResponse.ok("Answer generated successfully", response));
    }

    @GetMapping("/sessions")
    public ResponseEntity<ApiResponse<List<ChatSessionDto>>> getAllSessions() {
        List<ChatSessionDto> sessions = ragChatService.getAllSessions();
        return ResponseEntity.ok(ApiResponse.ok("Retrieved chat sessions", sessions));
    }

    @PostMapping("/sessions")
    public ResponseEntity<ApiResponse<ChatSessionDto>> createSession(@RequestBody(required = false) Map<String, String> body) {
        String title = body != null ? body.get("title") : "New Chat";
        ChatSessionDto session = ragChatService.createEmptySession(title);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Session created", session));
    }

    @GetMapping("/sessions/{id}")
    public ResponseEntity<ApiResponse<ChatSessionDto>> getSessionById(@PathVariable Long id) {
        ChatSessionDto session = ragChatService.getSessionById(id);
        return ResponseEntity.ok(ApiResponse.ok("Retrieved chat session", session));
    }

    @DeleteMapping("/sessions/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSession(@PathVariable Long id) {
        ragChatService.deleteSession(id);
        return ResponseEntity.ok(ApiResponse.ok("Chat session deleted", null));
    }
}
