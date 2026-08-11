package com.manabihub.identity.service;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.exception.BusinessException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

/**
 * SMS delivery adapter. The local/demo mode logs the destination and code so
 * the flow can be tested without a paid provider. Production can use any
 * provider accepting a JSON webhook with {@code to} and {@code message}.
 */
@Service
@Slf4j
public class ConfigurableSmsSender implements SmsSender {

    private final String mode;
    private final String webhookUrl;
    private final String apiKey;

    public ConfigurableSmsSender(
            @Value("${manabihub.phone-verification.sms-mode:console}") String mode,
            @Value("${manabihub.phone-verification.sms-webhook-url:}") String webhookUrl,
            @Value("${manabihub.phone-verification.sms-api-key:}") String apiKey
    ) {
        this.mode = mode == null ? "console" : mode.trim().toLowerCase();
        this.webhookUrl = webhookUrl;
        this.apiKey = apiKey;
    }

    @Override
    public void send(String phoneNumber, String message) {
        if ("console".equals(mode)) {
            log.warn("PHONE VERIFICATION DEMO SMS to {}: {}", mask(phoneNumber), message);
            return;
        }

        if (!"webhook".equals(mode) || webhookUrl == null || webhookUrl.isBlank()
                || apiKey == null || apiKey.isBlank()) {
            throw new BusinessException(
                    MessageCodes.PHONE_VERIFICATION_SMS_NOT_CONFIGURED,
                    "SMS provider is not configured"
            );
        }

        RestClient.create()
                .post()
                .uri(webhookUrl)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("to", phoneNumber, "message", message))
                .retrieve()
                .toBodilessEntity();
    }

    private String mask(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.length() < 4) {
            return "****";
        }
        return "******" + phoneNumber.substring(phoneNumber.length() - 4);
    }
}
