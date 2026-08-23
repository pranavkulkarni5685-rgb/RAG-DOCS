package com.example.aidocumentassistant.service;

import com.example.aidocumentassistant.config.GeminiConfig;
import com.example.aidocumentassistant.exception.GeminiApiException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
public class GeminiService {

    private static final Logger log = LoggerFactory.getLogger(GeminiService.class);

    private final GeminiConfig geminiConfig;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    private static final List<String> GENERATION_FALLBACK_MODELS = List.of(
            "gemini-3.5-flash-lite",
            "gemini-3.5-flash",
            "gemini-3.1-flash-lite",
            "gemma-4-26b-a4b-it",
            "gemini-1.5-flash"
    );

    private static final List<String> EMBEDDING_FALLBACK_MODELS = List.of(
            "gemini-embedding-001",
            "gemini-embedding-2",
            "text-embedding-004"
    );

    public GeminiService(GeminiConfig geminiConfig, ObjectMapper objectMapper) {
        this.geminiConfig = geminiConfig;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(15))
                .build();
    }

    public boolean isConfigured() {
        String key = geminiConfig.getApiKey();
        return key != null && !key.isBlank() && !key.equals("your_gemini_api_key_here");
    }

    public void updateApiKey(String apiKey) {
        if (apiKey != null) {
            this.geminiConfig.setApiKey(apiKey.trim());
        }
    }

    public List<Double> generateEmbedding(String text) {
        if (!isConfigured()) {
            throw new GeminiApiException("Gemini API key is not configured.");
        }

        List<String> modelsToTry = new ArrayList<>();
        modelsToTry.add(geminiConfig.getEmbeddingModel());
        for (String m : EMBEDDING_FALLBACK_MODELS) {
            if (!modelsToTry.contains(m)) modelsToTry.add(m);
        }

        for (String modelName : modelsToTry) {
            for (String version : List.of("v1beta", "v1")) {
                try {
                    String url = String.format("https://generativelanguage.googleapis.com/%s/models/%s:embedContent?key=%s",
                            version, modelName, geminiConfig.getApiKey());

                    ObjectNode rootNode = objectMapper.createObjectNode();
                    rootNode.put("model", "models/" + modelName);

                    ObjectNode contentNode = rootNode.putObject("content");
                    ArrayNode partsNode = contentNode.putArray("parts");
                    partsNode.addObject().put("text", text);

                    String requestBody = objectMapper.writeValueAsString(rootNode);

                    HttpRequest request = HttpRequest.newBuilder()
                            .uri(URI.create(url))
                            .header("Content-Type", "application/json")
                            .header("x-goog-api-key", geminiConfig.getApiKey())
                            .timeout(Duration.ofSeconds(20))
                            .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                            .build();

                    HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

                    if (response.statusCode() == 200) {
                        JsonNode responseJson = objectMapper.readTree(response.body());
                        JsonNode valuesNode = responseJson.path("embedding").path("values");

                        List<Double> vector = new ArrayList<>();
                        if (valuesNode.isArray()) {
                            for (JsonNode val : valuesNode) {
                                vector.add(val.asDouble());
                            }
                        }
                        if (!vector.isEmpty()) {
                            return vector;
                        }
                    } else {
                        log.debug("Embedding attempt with {} [{}] failed: status {}", modelName, version, response.statusCode());
                    }
                } catch (Exception e) {
                    log.debug("Embedding error for {} [{}]: {}", modelName, version, e.getMessage());
                }
            }
        }

        log.warn("Gemini embedding calls failed. Falling back to local semantic vectorizer.");
        return generateLocalSemanticVector(text, 128);
    }

    public List<List<Double>> batchGenerateEmbeddings(List<String> texts) {
        if (texts == null || texts.isEmpty()) return Collections.emptyList();
        List<List<Double>> result = new ArrayList<>();
        for (String t : texts) {
            result.add(generateEmbedding(t));
        }
        return result;
    }

    public String generateAnswer(String systemInstruction, String userPrompt) {
        if (!isConfigured()) {
            throw new GeminiApiException("Gemini API key is not configured.");
        }

        List<String> modelsToTry = new ArrayList<>();
        modelsToTry.add(geminiConfig.getModel());
        for (String m : GENERATION_FALLBACK_MODELS) {
            if (!modelsToTry.contains(m)) modelsToTry.add(m);
        }

        for (String modelName : modelsToTry) {
            for (String version : List.of("v1beta", "v1")) {
                try {
                    String url = String.format("https://generativelanguage.googleapis.com/%s/models/%s:generateContent?key=%s",
                            version, modelName, geminiConfig.getApiKey());

                    ObjectNode rootNode = objectMapper.createObjectNode();

                    if (systemInstruction != null && !systemInstruction.isBlank()) {
                        ObjectNode sysInstructionNode = rootNode.putObject("systemInstruction");
                        ArrayNode sysPartsNode = sysInstructionNode.putArray("parts");
                        sysPartsNode.addObject().put("text", systemInstruction);
                    }

                    ArrayNode contentsNode = rootNode.putArray("contents");
                    ObjectNode userContentNode = contentsNode.addObject();
                    userContentNode.put("role", "user");
                    ArrayNode userPartsNode = userContentNode.putArray("parts");
                    userPartsNode.addObject().put("text", userPrompt);

                    ObjectNode genConfig = rootNode.putObject("generationConfig");
                    genConfig.put("temperature", geminiConfig.getTemperature());
                    genConfig.put("maxOutputTokens", geminiConfig.getMaxTokens());

                    String requestBody = objectMapper.writeValueAsString(rootNode);

                    HttpRequest request = HttpRequest.newBuilder()
                            .uri(URI.create(url))
                            .header("Content-Type", "application/json")
                            .header("x-goog-api-key", geminiConfig.getApiKey())
                            .timeout(Duration.ofSeconds(30))
                            .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                            .build();

                    HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

                    if (response.statusCode() == 200) {
                        JsonNode responseJson = objectMapper.readTree(response.body());
                        JsonNode candidatesNode = responseJson.path("candidates");

                        if (candidatesNode.isArray() && !candidatesNode.isEmpty()) {
                            JsonNode partsNode = candidatesNode.get(0).path("content").path("parts");
                            if (partsNode.isArray() && !partsNode.isEmpty()) {
                                return partsNode.get(0).path("text").asText();
                            }
                        }
                    } else {
                        log.debug("Generation attempt with {} [{}] failed: status {}", modelName, version, response.statusCode());
                    }
                } catch (Exception e) {
                    log.debug("Generation error for {} [{}]: {}", modelName, version, e.getMessage());
                }
            }
        }

        throw new GeminiApiException("Unable to generate response from Gemini AI. Please check your network and API key.");
    }

    private List<Double> generateLocalSemanticVector(String text, int dim) {
        List<Double> vector = new ArrayList<>(dim);
        int[] counts = new int[dim];
        String[] tokens = text.toLowerCase().split("\\W+");
        for (String t : tokens) {
            if (t.isBlank()) continue;
            int bucket = Math.abs(t.hashCode()) % dim;
            counts[bucket]++;
        }
        double norm = 0.0;
        for (int c : counts) {
            norm += (double) c * c;
        }
        norm = Math.max(1e-6, Math.sqrt(norm));
        for (int c : counts) {
            vector.add((double) c / norm);
        }
        return vector;
    }
}
