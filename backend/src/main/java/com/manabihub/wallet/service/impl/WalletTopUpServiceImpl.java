package com.manabihub.wallet.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.identity.entity.AppUser;
import com.manabihub.identity.entity.StudentProfile;
import com.manabihub.identity.repository.StudentProfileRepository;
import com.manabihub.identity.service.CurrentUserService;
import com.manabihub.notification.service.NotificationService;
import com.manabihub.payment.config.VnPayProperties;
import com.manabihub.payment.dto.IpnAckResponse;
import com.manabihub.payment.gateway.PaymentCallbackResult;
import com.manabihub.payment.gateway.PaymentGateway;
import com.manabihub.payment.gateway.PaymentIntent;
import com.manabihub.wallet.dto.request.CreateTopUpRequest;
import com.manabihub.wallet.dto.response.WalletTopUpResponse;
import com.manabihub.wallet.entity.Wallet;
import com.manabihub.wallet.entity.WalletTopUp;
import com.manabihub.wallet.entity.WalletTransaction;
import com.manabihub.wallet.enums.WalletTopUpStatus;
import com.manabihub.wallet.enums.WalletTransactionType;
import com.manabihub.wallet.repository.WalletTopUpRepository;
import com.manabihub.wallet.service.WalletService;
import com.manabihub.wallet.service.WalletTopUpService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class WalletTopUpServiceImpl implements WalletTopUpService {

    static final BigDecimal MIN_AMOUNT = new BigDecimal("10000");
    static final BigDecimal MAX_AMOUNT = new BigDecimal("50000000");

    private static final BigDecimal MINOR_UNIT_FACTOR = BigDecimal.valueOf(100);
    private static final DateTimeFormatter CODE_TIME =
            DateTimeFormatter.ofPattern("yyyyMMddHHmmss").withZone(ZoneOffset.UTC);
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String NOTIFICATION_TYPE = "WALLET_TOPUP_SUCCESS";

    private final WalletTopUpRepository walletTopUpRepository;
    private final WalletService walletService;
    private final StudentProfileRepository studentProfileRepository;
    private final CurrentUserService currentUserService;
    private final PaymentGateway paymentGateway;
    private final VnPayProperties vnPayProperties;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public WalletTopUpResponse createTopUp(CreateTopUpRequest request, String clientIp) {
        BigDecimal amount = normaliseAmount(request.amount());
        StudentProfile student = resolveCurrentStudent();
        Wallet wallet = walletService.getOrCreateStudentWallet(student);

        WalletTopUp topUp = walletTopUpRepository.save(WalletTopUp.builder()
                .wallet(wallet)
                .student(student)
                .topUpCode(generateTopUpCode())
                .amount(amount)
                .currency(wallet.getCurrency())
                .status(WalletTopUpStatus.PENDING)
                .provider(paymentGateway.getProvider())
                .build());

        String paymentUrl = paymentGateway.buildPaymentUrl(toIntent(topUp), clientIp);

        log.info("[{}] Created wallet top-up {} for student {} ({} {})",
                MessageCodes.MSG_WALLET_002, topUp.getTopUpCode(), student.getId(),
                amount, wallet.getCurrency());

        return toResponse(topUp, paymentUrl);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WalletTopUpResponse> getMyTopUps() {
        StudentProfile student = resolveCurrentStudent();
        return walletTopUpRepository.findByStudent_IdOrderByCreatedAtDesc(student.getId()).stream()
                .map(topUp -> toResponse(topUp, null))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public WalletTopUpResponse getTopUpForCurrentStudent(UUID topUpId) {
        StudentProfile student = resolveCurrentStudent();

        // Ownership is part of the lookup, so another student's top-up is indistinguishable
        // from one that does not exist (BR-RBAC-01).
        WalletTopUp topUp = walletTopUpRepository.findById(topUpId)
                .filter(t -> t.getStudent().getId().equals(student.getId()))
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.WALLET_TOPUP_NOT_FOUND,
                        "Top-up request was not found",
                        HttpStatus.NOT_FOUND));

        return toResponse(topUp, null);
    }

    @Override
    @Transactional
    public IpnAckResponse handleCallback(Map<String, String> params) {
        PaymentCallbackResult result = paymentGateway.parseCallback(params);
        if (!result.signatureValid()) {
            log.warn("[{}] Rejected wallet top-up callback with invalid checksum, txnRef={}",
                    MessageCodes.MSG_PAY_004, result.orderCode());
            return IpnAckResponse.of("97", "Invalid Checksum");
        }

        // Pessimistic lock serializes concurrent callbacks for the same reference; combined
        // with the SUCCESS check below this makes crediting idempotent.
        WalletTopUp topUp = walletTopUpRepository.findByTopUpCodeForUpdate(result.orderCode()).orElse(null);
        if (topUp == null) {
            return IpnAckResponse.of("01", "Order not Found");
        }

        // Never trust the amount reported by the client/provider redirect — compare against
        // what we recorded when the request was created (NFR-SEC-14).
        long expectedMinor = topUp.getAmount().multiply(MINOR_UNIT_FACTOR).longValue();
        if (result.amount() != expectedMinor) {
            log.warn("[{}] Wallet top-up callback amount mismatch for {}: expected {}, got {}",
                    MessageCodes.MSG_PAY_004, topUp.getTopUpCode(), expectedMinor, result.amount());
            return IpnAckResponse.of("04", "Invalid Amount");
        }

        if (topUp.getStatus() == WalletTopUpStatus.SUCCESS) {
            log.info("[{}] Duplicate callback for already-credited wallet top-up {}",
                    MessageCodes.MSG_WALLET_005, topUp.getTopUpCode());
            return IpnAckResponse.of("02", "Order already confirmed");
        }

        topUp.setProviderTransactionId(result.providerTransactionId());
        topUp.setRawResponse(objectMapper.valueToTree(params));

        if (!result.paymentSuccessful()) {
            topUp.setStatus(WalletTopUpStatus.FAILED);
            walletTopUpRepository.save(topUp);
            log.info("[{}] Wallet top-up {} failed (responseCode={})",
                    MessageCodes.MSG_WALLET_004, topUp.getTopUpCode(), result.responseCode());
            return IpnAckResponse.of("00", "Confirm Success");
        }

        WalletTransaction ledgerLine = walletService.credit(
                topUp.getWallet(),
                topUp.getAmount(),
                WalletTransactionType.ADJUSTMENT,
                REFERENCE_TYPE,
                topUp.getId(),
                "Nạp tiền vào ví — " + topUp.getTopUpCode());

        topUp.setStatus(WalletTopUpStatus.SUCCESS);
        topUp.setWalletTransaction(ledgerLine);
        walletTopUpRepository.save(topUp);

        notifyStudent(topUp);

        log.info("[{}] Credited wallet top-up {} — {} {} added to wallet {}",
                MessageCodes.MSG_WALLET_003, topUp.getTopUpCode(), topUp.getAmount(),
                topUp.getCurrency(), topUp.getWallet().getId());
        return IpnAckResponse.of("00", "Confirm Success");
    }

    @Override
    @Transactional
    public IpnAckResponse simulateCallback(String topUpCode, boolean success) {
        WalletTopUp topUp = walletTopUpRepository.findByTopUpCode(topUpCode)
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.WALLET_TOPUP_NOT_FOUND,
                        "Top-up request was not found",
                        HttpStatus.NOT_FOUND));

        log.info("Simulating payment callback for wallet top-up {} (success={})", topUpCode, success);
        Map<String, String> signedParams =
                paymentGateway.buildSignedCallbackParams(toIntent(topUp), success);
        return handleCallback(signedParams);
    }

    // ── internals ───────────────────────────────────────────────────────────

    private PaymentIntent toIntent(WalletTopUp topUp) {
        return new PaymentIntent(
                topUp.getTopUpCode(),
                topUp.getAmount(),
                "Nap tien vao vi " + topUp.getTopUpCode(),
                PaymentIntent.withQuery(vnPayProperties.getWalletReturnUrl(), "topUpId=" + topUp.getId()));
    }

    /**
     * VND has no minor unit in practice and VNPay rejects fractional amounts, so a top-up is
     * constrained to a whole number of dong inside the configured bounds. Bean validation
     * covers the same bounds at the edge; this re-check keeps the rule true for any caller.
     */
    private BigDecimal normaliseAmount(BigDecimal amount) {
        if (amount == null || amount.scale() > 0 && amount.stripTrailingZeros().scale() > 0) {
            throw new BusinessException(
                    MessageCodes.WALLET_TOPUP_AMOUNT_INVALID,
                    "Top-up amount must be a whole number of VND",
                    HttpStatus.BAD_REQUEST);
        }
        if (amount.compareTo(MIN_AMOUNT) < 0 || amount.compareTo(MAX_AMOUNT) > 0) {
            throw new BusinessException(
                    MessageCodes.WALLET_TOPUP_AMOUNT_INVALID,
                    "Top-up amount must be between " + MIN_AMOUNT.toPlainString()
                            + " and " + MAX_AMOUNT.toPlainString() + " VND",
                    HttpStatus.BAD_REQUEST);
        }
        return amount.setScale(2, java.math.RoundingMode.UNNECESSARY);
    }

    private String generateTopUpCode() {
        String code;
        do {
            code = CODE_PREFIX + CODE_TIME.format(Instant.now())
                    + String.format("%04d", RANDOM.nextInt(10_000));
        } while (walletTopUpRepository.existsByTopUpCode(code));
        return code;
    }

    private StudentProfile resolveCurrentStudent() {
        return studentProfileRepository.findByUser_Id(currentUserService.getCurrentUserId())
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.LEARNING_STUDENT_PROFILE_NOT_FOUND,
                        "Student profile was not found.",
                        HttpStatus.FORBIDDEN));
    }

    private void notifyStudent(WalletTopUp topUp) {
        AppUser user = topUp.getStudent().getUser();
        notificationService.createNotification(
                user.getId(),
                user.getEmail(),
                "Nạp tiền vào ví thành công",
                "Ví của bạn đã được cộng " + topUp.getAmount().toPlainString() + " "
                        + topUp.getCurrency() + " (mã giao dịch " + topUp.getTopUpCode() + ").",
                NOTIFICATION_TYPE);
    }

    private WalletTopUpResponse toResponse(WalletTopUp topUp, String paymentUrl) {
        return new WalletTopUpResponse(
                topUp.getId(),
                topUp.getTopUpCode(),
                topUp.getAmount(),
                topUp.getCurrency(),
                topUp.getStatus(),
                topUp.getProvider(),
                paymentUrl,
                topUp.getCreatedAt(),
                topUp.getUpdatedAt());
    }
}
