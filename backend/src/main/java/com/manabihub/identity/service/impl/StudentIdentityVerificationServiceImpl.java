package com.manabihub.identity.service.impl;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.identity.dto.request.StudentIdentityVerificationRequest;
import com.manabihub.identity.dto.response.StudentIdentityVerificationResponse;
import com.manabihub.identity.entity.StudentProfile;
import com.manabihub.identity.repository.StudentProfileRepository;
import com.manabihub.identity.service.CurrentUserService;
import com.manabihub.identity.service.StudentIdentityVerificationService;
import com.manabihub.kyc.port.NationalIdRecordDto;
import com.manabihub.kyc.port.NationalIdRegistryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.text.Normalizer;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StudentIdentityVerificationServiceImpl implements StudentIdentityVerificationService {

    private static final String PROVIDER = "VNPT_EKYC_WEB_SDK_DEMO";
    private static final List<String> ID_KEYS = List.of("idNumber", "idNo", "identityNumber", "documentNumber", "cardNumber", "soCccd", "cccd", "soid", "id");
    private static final List<String> NAME_KEYS = List.of("fullName", "name", "hoTen", "hoten", "holderName");
    private static final List<String> DOB_KEYS = List.of("dateOfBirth", "dob", "birthDate", "ngaySinh", "birthday");
    private static final List<DateTimeFormatter> DOB_FORMATS = List.of(
            DateTimeFormatter.ISO_LOCAL_DATE,
            DateTimeFormatter.ofPattern("dd/MM/yyyy"),
            DateTimeFormatter.ofPattern("dd-MM-yyyy"),
            DateTimeFormatter.BASIC_ISO_DATE
    );

    private final StudentProfileRepository studentProfileRepository;
    private final CurrentUserService currentUserService;
    private final NationalIdRegistryPort nationalIdRegistry;

    @Value("${manabihub.kyc.identity-secret:}")
    private String identitySecret;

    @Override
    @Transactional(readOnly = true)
    public StudentIdentityVerificationResponse getStatus() {
        return toResponse(requireStudent());
    }

    @Override
    @Transactional
    public StudentIdentityVerificationResponse verify(StudentIdentityVerificationRequest request) {
        StudentProfile student = requireStudent();
        String idNumber = normalizeId(firstValue(request.sdkResult(), ID_KEYS));
        String fullName = firstValue(request.sdkResult(), NAME_KEYS);
        String dateOfBirthRaw = firstValue(request.sdkResult(), DOB_KEYS);
        LocalDate dateOfBirth = parseDate(dateOfBirthRaw);

        NationalIdRecordDto registry = nationalIdRegistry.findActiveByIdNumber(idNumber)
                .orElseThrow(() -> invalidIdentity("CCCD không tồn tại trong dữ liệu demo."));
        if (!sameName(fullName, registry.fullName()) || !dateOfBirth.equals(registry.dateOfBirth())) {
            throw invalidIdentity("Thông tin VNPT không khớp dữ liệu CCCD demo.");
        }

        ensureSecret();
        student.setIdentityFingerprint(fingerprint(idNumber));
        student.setIdentityProvider(PROVIDER);
        student.setIdentityFullName(registry.fullName());
        student.setIdentityDateOfBirth(registry.dateOfBirth());
        student.setIdentityVerifiedAt(Instant.now());
        try {
            return toResponse(studentProfileRepository.save(student));
        } catch (DataIntegrityViolationException ex) {
            // The fingerprint is unique across students. Do not leak the raw
            // identity or database constraint to the client.
            throw new BusinessException(
                    MessageCodes.MSG_KYC_008,
                    "CCCD này đã được liên kết với một tài khoản khác.",
                    HttpStatus.CONFLICT);
        }
    }

    private StudentProfile requireStudent() {
        UUID userId = currentUserService.getCurrentUserId();
        return studentProfileRepository.findByUser_Id(userId)
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.LEARNING_STUDENT_PROFILE_NOT_FOUND,
                        "Student profile was not found",
                        HttpStatus.NOT_FOUND));
    }

    private StudentIdentityVerificationResponse toResponse(StudentProfile student) {
        boolean verified = student.getIdentityVerifiedAt() != null;
        return new StudentIdentityVerificationResponse(
                verified,
                verified ? "VERIFIED" : "NOT_VERIFIED",
                verified ? student.getIdentityProvider() : null,
                verified ? "••••••••" : null,
                verified ? student.getIdentityFullName() : null,
                verified ? student.getIdentityDateOfBirth() : null,
                student.getIdentityVerifiedAt());
    }

    private String normalizeId(String raw) {
        if (!StringUtils.hasText(raw)) {
            throw invalidIdentity("VNPT chưa trả về số CCCD.");
        }
        String digits = raw.replaceAll("[^0-9]", "");
        if (digits.length() != 12) {
            throw invalidIdentity("Số CCCD phải gồm đúng 12 chữ số.");
        }
        return digits;
    }

    private LocalDate parseDate(String raw) {
        if (!StringUtils.hasText(raw)) {
            throw invalidIdentity("VNPT chưa trả về ngày sinh.");
        }
        for (DateTimeFormatter formatter : DOB_FORMATS) {
            try {
                return LocalDate.parse(raw.trim(), formatter);
            } catch (DateTimeParseException ignored) {
                // Try the next supported VNPT representation.
            }
        }
        throw invalidIdentity("Ngày sinh VNPT trả về không hợp lệ.");
    }

    private boolean sameName(String left, String right) {
        return normalizeName(left).equals(normalizeName(right));
    }

    private String normalizeName(String value) {
        if (value == null) {
            return "";
        }
        String decomposed = Normalizer.normalize(value.replace('Đ', 'D').replace('đ', 'd'), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return decomposed.replaceAll("[^\\p{Alnum}]", "")
                .toUpperCase(Locale.ROOT);
    }

    private String firstValue(Object value, List<String> keys) {
        if (value instanceof Map<?, ?> map) {
            for (Map.Entry<?, ?> entry : map.entrySet()) {
                if (entry.getKey() != null && keys.stream().anyMatch(key -> key.equalsIgnoreCase(String.valueOf(entry.getKey())))) {
                    String result = scalar(entry.getValue());
                    if (StringUtils.hasText(result)) {
                        return result.trim();
                    }
                }
            }
            for (Object child : map.values()) {
                String result = firstValue(child, keys);
                if (StringUtils.hasText(result)) {
                    return result;
                }
            }
        } else if (value instanceof List<?> list) {
            for (Object child : list) {
                String result = firstValue(child, keys);
                if (StringUtils.hasText(result)) {
                    return result;
                }
            }
        }
        return null;
    }

    private String scalar(Object value) {
        return value instanceof String || value instanceof Number ? String.valueOf(value) : null;
    }

    private String fingerprint(String idNumber) {
        try {
            Mac hmac = Mac.getInstance("HmacSHA256");
            hmac.init(new SecretKeySpec(identitySecret.trim().getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(hmac.doFinal(idNumber.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException | InvalidKeyException exception) {
            throw new BusinessException(MessageCodes.COMMON_INTERNAL_ERROR, "Không thể lưu bằng chứng xác minh demo", HttpStatus.INTERNAL_SERVER_ERROR, exception);
        }
    }

    private void ensureSecret() {
        if (!StringUtils.hasText(identitySecret) || identitySecret.trim().length() < 32) {
            throw new BusinessException(MessageCodes.COMMON_INTERNAL_ERROR, "KYC_IDENTITY_SECRET chưa được cấu hình đủ mạnh", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private BusinessException invalidIdentity(String message) {
        return new BusinessException(MessageCodes.MSG_KYC_002, message, HttpStatus.BAD_REQUEST);
    }
}
