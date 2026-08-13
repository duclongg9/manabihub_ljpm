package com.manabihub.identity.config;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.net.URI;

@Component
@Profile("prod")
@RequiredArgsConstructor
public class PhoneVerificationSmsProductionValidator implements InitializingBean {

    private final PhoneVerificationSmsProperties properties;

    @Override
    public void afterPropertiesSet() {
        validate(properties);
    }

    static void validate(PhoneVerificationSmsProperties properties) {
        if (properties.getSmsTimeoutSeconds() < 1 || properties.getSmsTimeoutSeconds() > 30) {
            throw invalid("PHONE_VERIFICATION_SMS_TIMEOUT_SECONDS must be between 1 and 30");
        }

        String mode = properties.getSmsMode() == null
                ? ""
                : properties.getSmsMode().trim().toLowerCase();
        if ("esms".equals(mode)) {
            PhoneVerificationSmsProperties.Esms esms = properties.getEsms();
            if (esms == null
                    || !StringUtils.hasText(esms.getApiKey())
                    || !StringUtils.hasText(esms.getSecretKey())
                    || !StringUtils.hasText(esms.getBrandname())) {
                throw invalid("eSMS API key, SecretKey, and Brandname are required in production");
            }
            return;
        }

        if ("webhook".equals(mode)) {
            if (!StringUtils.hasText(properties.getSmsWebhookUrl())
                    || !StringUtils.hasText(properties.getSmsApiKey())) {
                throw invalid("SMS webhook URL and API key are required in production");
            }
            URI webhookUri;
            try {
                webhookUri = URI.create(properties.getSmsWebhookUrl());
            } catch (IllegalArgumentException exception) {
                throw invalid("SMS webhook URL must be an absolute HTTPS URL");
            }
            if (!"https".equalsIgnoreCase(webhookUri.getScheme()) || webhookUri.getHost() == null) {
                throw invalid("SMS webhook URL must be an absolute HTTPS URL");
            }
            return;
        }

        throw invalid("PHONE_VERIFICATION_SMS_MODE must be esms or webhook in production");
    }

    private static IllegalStateException invalid(String message) {
        return new IllegalStateException("Phone verification SMS configuration is invalid: " + message);
    }
}
