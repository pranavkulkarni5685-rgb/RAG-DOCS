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
    private int chunkSize = 1000;
    private int chunkOverlap = 200;
    private int topK = 12;
    private double similarityThreshold = 0.25;
}
