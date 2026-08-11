package com.manabihub.ai.provider;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.manabihub.ai.config.AiChatProviderProperties;
import com.manabihub.ai.domain.AiChatContext;
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
public class OpenAiCompatibleAiChatProvider implements AiChatProvider {

    private final RestClient.Builder restClientBuilder;
    private final AiChatProviderProperties properties;

    @Override
    public AiChatProviderResult generate(AiChatContext context, String question) {
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
                            "temperature", 0.2,
                            "messages", List.of(
                                    Map.of("role", "system", "content", buildSystemPrompt(context)),
                                    Map.of("role", "user", "content", question)
                            )
                    ))
                    .retrieve()
                    .body(ProviderResponse.class);

            String answer = extractAnswer(response);
            return new AiChatProviderResult(
                    answer,
                    "openai-compatible",
                    response.usage() == null ? null : response.usage().promptTokens(),
                    response.usage() == null ? null : response.usage().completionTokens()
            );
        } catch (RestClientException exception) {
            throw new AiChatProviderException("AI_PROVIDER_REQUEST_FAILED", exception);
        }
    }

    private String buildSystemPrompt(AiChatContext context) {
        return """
                You are ManabiHub's lesson assistant. Answer only from the current lesson block and the allowed course metadata below.
                If the requested answer is not supported by this context, say that it is unavailable in the current lesson instead of using general knowledge.

                Course title: %s
                Course description: %s
                Course outcomes: %s
                Current lesson title: %s
                Current lesson content:
                %s
                """.formatted(
                context.courseTitle(),
                context.courseDescription(),
                context.courseOutcomes(),
                context.lessonTitle(),
                context.lessonContent()
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
