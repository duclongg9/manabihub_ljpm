package com.manabihub.systemconfig.controller;

import com.manabihub.systemconfig.dto.CommercialPolicyDto;
import com.manabihub.systemconfig.repository.SystemSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/public/commercial-policy")
@RequiredArgsConstructor
public class PublicCommercialPolicyController {

    private final SystemSettingRepository systemSettingRepository;

    @GetMapping("/current")
    public ResponseEntity<CommercialPolicyDto> getCurrentPolicy() {
        Map<String, String> settings = systemSettingRepository.findAll().stream()
                .collect(Collectors.toMap(s -> s.getSettingKey(), s -> s.getSettingValue()));

        CommercialPolicyDto dto = new CommercialPolicyDto(
                settings.getOrDefault("CURRENCY", "VND"),
                new BigDecimal(settings.getOrDefault("COMMISSION_RATE", "0.20")),
                Integer.parseInt(settings.getOrDefault("REFUND_WINDOW_DAYS", "7")),
                Integer.parseInt(settings.getOrDefault("REFUND_PROGRESS_LIMIT_PERCENT", "30")),
                Integer.parseInt(settings.getOrDefault("ESCROW_HOLDING_DAYS", "14")),
                new BigDecimal(settings.getOrDefault("PAYOUT_THRESHOLD", "500000")),
                new BigDecimal(settings.getOrDefault("WITHDRAWAL_FEE", "11000")),
                Integer.parseInt(settings.getOrDefault("KYC_TARGET_DAYS_MIN", "1")),
                Integer.parseInt(settings.getOrDefault("KYC_TARGET_DAYS_MAX", "3")),
                settings.getOrDefault("POLICY_VERSION", "1.0.0-provisional"),
                settings.getOrDefault("POLICY_EFFECTIVE_DATE", "2026-07-28T00:00:00Z")
        );

        return ResponseEntity.ok(dto);
    }
}
