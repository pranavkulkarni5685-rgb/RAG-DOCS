package com.example.aidocumentassistant.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "rag")
@Getter
@Setter
public class RagConfig {
    private int chunkSize = 600;
    private int chunkOverlap = 120;
    private int topK = 4;
    private double similarityThreshold = 0.35;
}
