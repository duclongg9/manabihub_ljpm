package com.manabihub.systemconfig.service;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.exception.BusinessException;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Set;

@Component
public class SystemSettingValidator {

    public static final Set<String> SUPPORTED_KEYS = Set.of(
            "COMMISSION_RATE",
            "COURSE_PRICE_FLOOR",
            "AI_SUPPORT_PRICE_FLOOR",
            "REFUND_WINDOW_DAYS",
            "REFUND_PROGRESS_LIMIT_PERCENT",
            "ESCROW_HOLDING_DAYS",
            "PAYOUT_THRESHOLD",
            "AI_ENABLED",
            "AI_WRITING_ENABLED",
            "AI_CHATBOT_ENABLED",
            "ADMIN_LOCKOUT_MAX_ATTEMPTS",
            "ADMIN_LOCKOUT_DURATION_MINUTES",
            "COURSE_MIN_LEARNING_GOALS",
            "COURSE_MAX_LEARNING_GOAL_LENGTH"
    );

    public String normalize(String key, String rawValue) {
        String value = rawValue == null ? "" : rawValue.trim();

        return switch (key) {
            case "COMMISSION_RATE" -> decimalInRange(key, value, BigDecimal.ZERO, BigDecimal.ONE, false);
            case "COURSE_PRICE_FLOOR", "AI_SUPPORT_PRICE_FLOOR", "PAYOUT_THRESHOLD" ->
                    integerInRange(key, value, 0, 10_000_000_000L);
            case "REFUND_WINDOW_DAYS", "ESCROW_HOLDING_DAYS" ->
                    integerInRange(key, value, 0, 365);
            case "REFUND_PROGRESS_LIMIT_PERCENT" ->
                    integerInRange(key, value, 0, 100);
            case "ADMIN_LOCKOUT_MAX_ATTEMPTS" ->
                    integerInRange(key, value, 3, 20);
            case "ADMIN_LOCKOUT_DURATION_MINUTES" ->
                    integerInRange(key, value, 1, 1_440);
            case "COURSE_MIN_LEARNING_GOALS" ->
                    integerInRange(key, value, 1, 20);
            case "COURSE_MAX_LEARNING_GOAL_LENGTH" ->
                    integerInRange(key, value, 20, 1_000);
            case "AI_ENABLED", "AI_WRITING_ENABLED", "AI_CHATBOT_ENABLED" ->
                    booleanValue(key, value);
            default -> throw invalid(key, "This setting is not supported by the current release");
        };
    }

    private String decimalInRange(
            String key,
            String value,
            BigDecimal minimum,
            BigDecimal maximum,
            boolean integerOnly
    ) {
        try {
            BigDecimal number = new BigDecimal(value);
            BigDecimal normalized = number.stripTrailingZeros();
            if (number.compareTo(minimum) < 0 || number.compareTo(maximum) > 0) {
                throw invalid(key, "Value is outside the allowed range");
            }
            if (integerOnly && normalized.scale() > 0) {
                throw invalid(key, "Value must be a whole number");
            }
            return normalized.toPlainString();
        } catch (NumberFormatException exception) {
            throw invalid(key, "Value must be numeric");
        }
    }

    private String integerInRange(String key, String value, long minimum, long maximum) {
        return decimalInRange(
                key,
                value,
                BigDecimal.valueOf(minimum),
                BigDecimal.valueOf(maximum),
                true
        );
    }

    private String booleanValue(String key, String value) {
        if ("true".equalsIgnoreCase(value)) {
            return "true";
        }
        if ("false".equalsIgnoreCase(value)) {
            return "false";
        }
        throw invalid(key, "Value must be true or false");
    }

    private BusinessException invalid(String key, String message) {
        return new BusinessException(
                MessageCodes.SYSTEM_SETTING_INVALID,
                key + ": " + message
        );
    }
}
