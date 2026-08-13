package com.manabihub.kyc.service;

import org.springframework.util.StringUtils;

import java.lang.reflect.Array;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Validates the security-relevant part of the VNPT browser SDK callback.
 *
 * <p>The browser payload is treated as evidence, not as a trusted identity by
 * itself. A successful decision requires all of the following:</p>
 * <ul>
 *     <li>no explicit document, spoof, mask, mismatch or warning signal;</li>
 *     <li>CCCD number, full name and date of birth from OCR;</li>
 *     <li>an explicit successful liveness/face comparison signal.</li>
 * </ul>
 * The caller must still cross-check the extracted identity with the configured
 * national identity registry before granting a verified state.
 */
public final class VnptSdkResultEvaluator {

    private static final int MAX_DEPTH = 8;

    private VnptSdkResultEvaluator() {
    }

    public static VnptSdkDecision evaluate(Map<String, Object> sdkResult) {
        if (sdkResult == null || sdkResult.isEmpty()) {
            return new VnptSdkDecision(false, Map.of(),
                    List.of("VNPT SDK did not return a result payload"));
        }

        List<ResultEntry> entries = flatten(sdkResult);
        boolean invalidProviderSignal = entries.stream().anyMatch(VnptSdkResultEvaluator::isExplicitInvalidValue)
                || hasNonEmptyCollection(entries, "generalwarning", "warning")
                || hasNonBlankWarning(entries)
                || hasAffirmativeSignal(entries, "masked")
                || hasNumericRiskSignal(entries);
        Map<String, String> identityOcr = extractIdentityOcr(entries);
        boolean requiredOcr = StringUtils.hasText(identityOcr.get("idNumber"))
                && StringUtils.hasText(identityOcr.get("fullName"))
                && StringUtils.hasText(identityOcr.get("dateOfBirth"));
        boolean faceVerified = hasAcceptedFaceVerification(entries);

        List<String> reasons = new ArrayList<>();
        if (invalidProviderSignal) {
            reasons.add("VNPT validation returned an invalid, mismatched or spoofed result");
        }
        if (!requiredOcr) {
            reasons.add("VNPT OCR did not return CCCD number, full name and date of birth");
        }
        if (!faceVerified) {
            reasons.add("VNPT liveness/face comparison was not successful");
        }
        return new VnptSdkDecision(reasons.isEmpty(), Map.copyOf(identityOcr), List.copyOf(reasons));
    }

    private static List<ResultEntry> flatten(Map<String, Object> root) {
        List<ResultEntry> entries = new ArrayList<>();
        collect(root, "", entries, 0);
        return entries;
    }

    private static void collect(Object current, String path, List<ResultEntry> entries, int depth) {
        if (current == null || depth > MAX_DEPTH) {
            return;
        }
        if (current instanceof Map<?, ?> map) {
            map.forEach((key, value) -> {
                String segment = String.valueOf(key).toLowerCase();
                String nextPath = path.isBlank() ? segment : path + "." + segment;
                entries.add(new ResultEntry(nextPath, value));
                collect(value, nextPath, entries, depth + 1);
            });
        } else if (current instanceof Iterable<?> iterable) {
            for (Object item : iterable) {
                collect(item, path, entries, depth + 1);
            }
        }
    }

    private static boolean isExplicitInvalidValue(ResultEntry entry) {
        Object value = entry.value();
        String normalizedKey = normalizeKey(entry.key());
        if (isDecisionKey(entry.key()) && value instanceof Boolean flag) {
            return isNegativeDecisionKey(normalizedKey) ? flag : !flag;
        }
        if (isNegativeDecisionKey(normalizedKey) && affirmativeFlag(value)) {
            return true;
        }
        if (isDecisionKey(entry.key()) && value instanceof String text) {
            String normalized = normalizeText(text).trim();
            return normalized.contains("khong hop le")
                    || normalized.contains("khong cung loai")
                    || normalized.contains("khong trung khop")
                    || normalized.contains("khong khop")
                    || normalized.contains("khong thanh cong")
                    || normalized.contains("that bai")
                    || normalized.contains("invalid")
                    || normalized.contains("not valid")
                    || normalized.contains("not same")
                    || normalized.contains("not match")
                    || normalized.contains("nomatch")
                    || normalized.equals("nothing")
                    || normalized.contains("mismatch")
                    || normalized.contains("failed")
                    || normalized.contains("failure")
                    || isTerminalFailureStatus(normalized)
                    || normalized.equals("null");
        }
        return false;
    }

    /**
     * A flow-level terminal failure must take precedence over successful OCR
     * or face callbacks received earlier in the same SDK session.
     */
    private static boolean isTerminalFailureStatus(String value) {
        String compact = normalizeKey(value);
        if (Set.of("noerror", "withouterror").contains(compact)) {
            return false;
        }
        return compact.contains("cancel")
                || compact.contains("abort")
                || compact.contains("timeout")
                || compact.contains("timedout")
                || compact.equals("error")
                || compact.startsWith("error")
                || compact.endsWith("error");
    }

    private static boolean isNegativeDecisionKey(String key) {
        return key.contains("fake") || key.contains("spoof") || key.contains("tamper")
                || key.contains("multiple") || key.contains("warning") || key.contains("swapping");
    }

    private static boolean hasNonEmptyCollection(List<ResultEntry> entries, String... aliases) {
        Set<String> keys = Arrays.stream(aliases).map(VnptSdkResultEvaluator::normalizeKey).collect(Collectors.toSet());
        return entries.stream()
                .filter(entry -> keys.contains(normalizeKey(lastSegment(entry.key()))))
                .map(ResultEntry::value)
                .anyMatch(value -> {
                    if (value instanceof Iterable<?> iterable) {
                        return iterable.iterator().hasNext();
                    }
                    return value != null && value.getClass().isArray() && Array.getLength(value) > 0;
                });
    }

    private static boolean hasNonBlankWarning(List<ResultEntry> entries) {
        return entries.stream()
                .filter(entry -> {
                    String key = normalizeKey(lastSegment(entry.key()));
                    return key.equals("warning") || key.equals("generalwarning") || key.equals("warningstatus");
                })
                .map(ResultEntry::value)
                .filter(value -> value instanceof String)
                .map(value -> normalizeText((String) value).trim())
                .anyMatch(value -> !value.isBlank()
                        && !Set.of("none", "no", "false", "0", "ok", "normal", "pass", "passed").contains(value));
    }

    /**
     * VNPT returns anti-spoof probabilities as scalar numbers. They are not
     * binary blobs and must survive the browser compaction, but a positive
     * spoof/fake/tamper probability is still a failed verification signal.
     * Values in [0,1] are probabilities; larger values are percentages.
     */
    private static boolean hasNumericRiskSignal(List<ResultEntry> entries) {
        return entries.stream()
                .filter(entry -> entry.value() instanceof Number)
                .filter(entry -> {
                    String key = normalizeKey(entry.key());
                    return key.contains("fake") || key.contains("spoof") || key.contains("tamper")
                            || key.contains("swapping") || key.contains("masked");
                })
                .map(entry -> ((Number) entry.value()).doubleValue())
                .anyMatch(value -> value > 0.2d && value < 100d || value >= 20d);
    }

    private static boolean hasAffirmativeSignal(List<ResultEntry> entries, String... aliases) {
        Set<String> keys = Arrays.stream(aliases).map(VnptSdkResultEvaluator::normalizeKey).collect(Collectors.toSet());
        return entries.stream()
                .filter(entry -> keys.contains(normalizeKey(lastSegment(entry.key()))))
                .anyMatch(entry -> affirmativeValue(entry.value()));
    }

    private static boolean affirmativeValue(Object value) {
        if (value instanceof Boolean flag) return flag;
        if (value instanceof Number number) return number.doubleValue() > 0;
        if (value instanceof String text) {
            return Set.of("true", "yes", "1", "co").contains(normalizeText(text).trim());
        }
        return false;
    }

    private static boolean affirmativeFlag(Object value) {
        if (value instanceof Boolean flag) return flag;
        return value instanceof String text
                && Set.of("true", "yes", "1", "co").contains(normalizeText(text).trim());
    }

    private static boolean hasAcceptedFaceVerification(List<ResultEntry> entries) {
        return entries.stream()
                .filter(entry -> isFaceVerificationKey(entry.key()))
                .anyMatch(VnptSdkResultEvaluator::isExplicitSuccessValue);
    }

    private static boolean isExplicitSuccessValue(ResultEntry entry) {
        Object value = entry.value();
        if (isDecisionKey(entry.key()) && value instanceof Boolean flag) {
            return flag;
        }
        if (value instanceof Number number && isVerificationScoreKey(entry.key())) {
            return acceptedScore(number.doubleValue());
        }
        if (!(value instanceof String text)) return false;

        String normalized = normalizeText(text).trim();
        if (isVerificationScoreKey(entry.key())) {
            try {
                if (acceptedScore(Double.parseDouble(normalized.replace("%", "").trim()))) return true;
            } catch (NumberFormatException ignored) {
                // Continue with the explicit textual statuses below.
            }
        }
        return Set.of("valid", "success", "verified", "matched", "match", "pass").contains(normalized)
                || normalized.contains("hop le") || normalized.contains("thanh cong");
    }

    private static boolean isDecisionKey(String key) {
        String normalized = normalizeKey(key);
        return isValidationKey(key) || normalized.endsWith("msg") || normalized.endsWith("message")
                || normalized.contains("fake") || normalized.contains("spoof") || normalized.contains("tamper");
    }

    private static boolean isVerificationScoreKey(String key) {
        String normalized = normalizeKey(key);
        boolean score = normalized.contains("prob") || normalized.contains("score")
                || normalized.contains("similarity") || normalized.contains("confidence")
                || normalized.contains("percentage");
        return isFaceVerificationKey(key) && score
                && !normalized.contains("blur") && !normalized.contains("fake")
                && !normalized.contains("spoof") && !normalized.contains("tamper")
                && !normalized.contains("swapping") && !normalized.contains("masked");
    }

    private static boolean acceptedScore(double value) {
        return (value >= 0 && value <= 1 && value >= 0.8) || value >= 80;
    }

    private static Map<String, String> extractIdentityOcr(List<ResultEntry> entries) {
        Map<String, String> result = new LinkedHashMap<>();
        putIfPresent(result, "idNumber", findValue(entries,
                "idnumber", "idno", "identitynumber", "documentnumber", "cardnumber", "socccd", "cccd", "soid", "id"));
        putIfPresent(result, "fullName", findValue(entries,
                "fullname", "hoten", "name", "customername"));
        putIfPresent(result, "dateOfBirth", findValue(entries,
                "dateofbirth", "birthdate", "birthday", "dob", "ngaysinh"));
        putIfPresent(result, "gender", findValue(entries, "gender", "sex", "gioitinh"));
        putIfPresent(result, "address", findValue(entries,
                "address", "residentaddress", "permanentaddress", "noithuongtru", "thuongtru"));
        return result;
    }

    private static void putIfPresent(Map<String, String> target, String key, String value) {
        if (StringUtils.hasText(value)) target.put(key, value);
    }

    private static String findValue(List<ResultEntry> entries, String... aliases) {
        Set<String> keys = Arrays.stream(aliases).map(VnptSdkResultEvaluator::normalizeKey).collect(Collectors.toSet());
        return entries.stream()
                .filter(entry -> keys.contains(normalizeKey(lastSegment(entry.key()))))
                .map(entry -> displayScalar(entry.value()))
                .filter(StringUtils::hasText)
                .findFirst()
                .orElseGet(() -> entries.stream()
                        .filter(entry -> keys.stream().anyMatch(alias -> alias.length() > 2
                                && normalizeKey(entry.key()).endsWith(alias)))
                        .map(entry -> displayScalar(entry.value()))
                        .filter(StringUtils::hasText)
                        .findFirst().orElse(null));
    }

    private static String displayScalar(Object value) {
        if (value instanceof String text) {
            String trimmed = text.trim();
            return trimmed.length() <= 240 ? trimmed : null;
        }
        return value instanceof Number ? String.valueOf(value) : null;
    }

    private static boolean isValidationKey(String key) {
        String normalized = normalizeKey(key);
        return normalized.contains("success") || normalized.contains("verified")
                || normalized.contains("valid") || normalized.contains("validation")
                || normalized.contains("result") || normalized.contains("status")
                || normalized.contains("same") || normalized.contains("match")
                || normalized.contains("compare") || normalized.contains("liveness");
    }

    private static boolean isFaceVerificationKey(String key) {
        String normalized = normalizeKey(key);
        // Card/document liveness proves that the document is present, not that
        // the person holding it is live. It must never satisfy the face gate.
        if (normalized.contains("card") || normalized.contains("document")
                || normalized.contains("ocr")) {
            return false;
        }
        return normalized.contains("face") || normalized.contains("selfie")
                || normalized.contains("portrait") || normalized.contains("compare")
                || normalized.contains("comparison") || normalized.contains("matching")
                || normalized.contains("similarity");
    }

    private static String lastSegment(String path) {
        int dot = path.lastIndexOf('.');
        return dot < 0 ? path : path.substring(dot + 1);
    }

    private static String normalizeKey(String value) {
        return Normalizer.normalize(value == null ? "" : value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replaceAll("[^A-Za-z0-9]", "")
                .toLowerCase();
    }

    private static String normalizeText(String value) {
        return Normalizer.normalize(value == null ? "" : value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase();
    }

    private record ResultEntry(String key, Object value) {
    }
}
