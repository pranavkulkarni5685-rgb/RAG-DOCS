package com.example.aidocumentassistant.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SettingsDto {
    private boolean geminiConfigured;
    private String maskedApiKey;
    private String model;
    private String embeddingModel;
    private int topK;
    private double similarityThreshold;
    private String uploadDir;
    private String databaseStatus;
}
