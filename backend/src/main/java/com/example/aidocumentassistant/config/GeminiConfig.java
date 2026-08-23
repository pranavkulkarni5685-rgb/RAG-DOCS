package com.example.aidocumentassistant.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "gemini")
@Getter
@Setter
public class GeminiConfig {
    private String apiKey = "";
    private String baseUrl = "https://generativelanguage.googleapis.com/v1beta";
    private String model = "gemini-3.5-flash-lite";
    private String embeddingModel = "gemini-embedding-001";
    private double temperature = 0.2;
    private int maxTokens = 2048;
}
