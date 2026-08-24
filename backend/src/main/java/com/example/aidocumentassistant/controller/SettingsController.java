package com.example.aidocumentassistant.controller;

import com.example.aidocumentassistant.config.GeminiConfig;
import com.example.aidocumentassistant.config.RagConfig;
import com.example.aidocumentassistant.dto.ApiResponse;
import com.example.aidocumentassistant.dto.SettingsDto;
import com.example.aidocumentassistant.service.GeminiService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping({"/api/settings", "/settings"})
public class SettingsController {

    private final GeminiConfig geminiConfig;
    private final RagConfig ragConfig;
    private final GeminiService geminiService;
    private final String uploadDir;

    public SettingsController(
            GeminiConfig geminiConfig,
            RagConfig ragConfig,
            GeminiService geminiService,
            @Value("${app.upload.dir:D:/ai-document-assistant/uploads}") String uploadDir) {
        this.geminiConfig = geminiConfig;
        this.ragConfig = ragConfig;
        this.geminiService = geminiService;
        this.uploadDir = uploadDir;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<SettingsDto>> getSettings() {
        String key = geminiConfig.getApiKey();
        String maskedKey = (key != null && key.length() > 8)
                ? key.substring(0, 4) + "..." + key.substring(key.length() - 4)
                : (geminiService.isConfigured() ? "Configured" : "Not Set");

        SettingsDto dto = SettingsDto.builder()
                .geminiConfigured(geminiService.isConfigured())
                .maskedApiKey(maskedKey)
                .model(geminiConfig.getModel())
                .embeddingModel(geminiConfig.getEmbeddingModel())
                .topK(ragConfig.getTopK())
                .similarityThreshold(ragConfig.getSimilarityThreshold())
                .uploadDir(uploadDir)
                .databaseStatus("Connected")
                .build();

        return ResponseEntity.ok(ApiResponse.ok("Settings retrieved", dto));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SettingsDto>> updateSettings(@RequestBody Map<String, Object> body) {
        if (body.containsKey("apiKey")) {
            String newKey = (String) body.get("apiKey");
            geminiService.updateApiKey(newKey);
        }
        if (body.containsKey("topK")) {
            try {
                ragConfig.setTopK(Integer.parseInt(body.get("topK").toString()));
            } catch (Exception ignored) {}
        }
        if (body.containsKey("similarityThreshold")) {
            try {
                ragConfig.setSimilarityThreshold(Double.parseDouble(body.get("similarityThreshold").toString()));
            } catch (Exception ignored) {}
        }

        return getSettings();
    }
}
