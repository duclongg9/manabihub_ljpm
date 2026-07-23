package com.manabihub.ai.provider;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.manabihub.ai.config.AiChatProviderProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class AiWritingAssistanceProvider {

    private final RestClient.Builder restClientBuilder;
    private final AiChatProviderProperties properties;
    private final ObjectMapper objectMapper;

    public Result generate(String writingPrompt, String rubric, String studentContent) {
        if (!StringUtils.hasText(properties.getBaseUrl()) || !StringUtils.hasText(properties.getApiKey())) {
            throw new AiChatProviderException("AI_PROVIDER_NOT_CONFIGURED");
        }

        try {
            ProviderResponse response = createClient()
                    .post()
                    .uri(resolveEndpoint())
                    .contentType(MediaType.APPLICATION_JSON)
                    .headers(headers -> headers.setBearerAuth(properties.getApiKey()))
                    .body(Map.of(
                            "model", resolveModel(),
                            "temperature", 0.3,
                            "response_format", Map.of("type", "json_object"),
                            "messages", List.of(
                                    Map.of("role", "system", "content", buildSystemPrompt(writingPrompt, rubric)),
                                    Map.of("role", "user", "content", studentContent)
                            )
                    ))
                    .retrieve()
                    .body(ProviderResponse.class);

            String answer = extractAnswer(response);
            JsonNode jsonNode = objectMapper.readTree(answer);

            JsonNode grammar = jsonNode.path("grammarSuggestions");
            JsonNode vocab = jsonNode.path("vocabularySuggestions");
            JsonNode structure = jsonNode.path("structureSuggestions");

            if (!grammar.isArray() || !vocab.isArray() || !structure.isArray()) {
                throw new AiChatProviderException("AI_PROVIDER_INVALID_SCHEMA");
            }

            return new Result(
                    grammar,
                    vocab,
                    structure,
                    jsonNode.path("revisionGuidance").asText(null),
                    "openai-compatible",
                    response.usage() == null ? null : response.usage().promptTokens(),
                    response.usage() == null ? null : response.usage().completionTokens()
            );
        } catch (RestClientException e) {
            throw new AiChatProviderException("AI_PROVIDER_REQUEST_FAILED", e);
        } catch (AiChatProviderException e) {
            throw e;
        } catch (Exception e) {
            throw new AiChatProviderException("AI_PROVIDER_INVALID_JSON", e);
        }
    }

    private String buildSystemPrompt(String writingPrompt, String rubric) {
        return """
                You are ManabiHub's AI writing assistant. Your task is to provide preliminary suggestions for a student's writing assignment.
                Do not output a final score, grade, pass/fail result, or determine completion. Provide constructive feedback only.

                Writing Prompt:
                %s

                Rubric/Criteria:
                %s

                Analyze the student's submission and return a JSON object with the following schema:
                {
                  "grammarSuggestions": [ { "error": "...", "correction": "...", "explanation": "..." } ],
                  "vocabularySuggestions": [ { "word": "...", "suggestion": "...", "explanation": "..." } ],
                  "structureSuggestions": [ { "issue": "...", "suggestion": "..." } ],
                  "revisionGuidance": "Overall paragraph summarizing what the student did well and what to improve next."
                }

                Ensure the output is strictly valid JSON. Do not include markdown blocks.
                """.formatted(
                StringUtils.hasText(writingPrompt) ? writingPrompt : "No prompt provided.",
                StringUtils.hasText(rubric) ? rubric : "No rubric provided."
        );
    }

    private String extractAnswer(ProviderResponse response) {
        if (response == null || response.choices() == null || response.choices().isEmpty()) {
            throw new AiChatProviderException("AI_PROVIDER_EMPTY_RESPONSE");
        }
        String answer = response.choices().getFirst().message() == null
                ? null
                : response.choices().getFirst().message().content();
        if (!StringUtils.hasText(answer)) {
            throw new AiChatProviderException("AI_PROVIDER_EMPTY_RESPONSE");
        }
        return answer;
    }

    private String resolveEndpoint() {
        return StringUtils.hasText(properties.getEndpoint())
                ? properties.getEndpoint()
                : "/v1/chat/completions";
    }

    private String resolveModel() {
        return StringUtils.hasText(properties.getModel()) ? properties.getModel() : "gpt-4o-mini";
    }

    private String trimTrailingSlash(String value) {
        return value.replaceAll("/+$", "");
    }

    private RestClient createClient() {
        int timeoutMillis = Math.max(1, properties.getTimeoutSeconds()) * 1_000;
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(timeoutMillis);
        requestFactory.setReadTimeout(timeoutMillis);

        return restClientBuilder
                .baseUrl(trimTrailingSlash(properties.getBaseUrl()))
                .requestFactory(requestFactory)
                .build();
    }

    public record Result(
            JsonNode grammarSuggestions,
            JsonNode vocabularySuggestions,
            JsonNode structureSuggestions,
            String revisionGuidance,
            String provider,
            Integer inputTokens,
            Integer outputTokens
    ) {
    }

    private record ProviderResponse(List<Choice> choices, Usage usage) {
    }

    private record Choice(ProviderMessage message) {
    }

    private record ProviderMessage(String content) {
    }

    private record Usage(
            @JsonProperty("prompt_tokens") Integer promptTokens,
            @JsonProperty("completion_tokens") Integer completionTokens
    ) {
    }
}
