package com.manabihub.wallet.service.impl;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.common.response.PageResponse;
import com.manabihub.identity.entity.StudentProfile;
import com.manabihub.identity.repository.IdentityTeacherProfileRepository;
import com.manabihub.identity.repository.StudentProfileRepository;
import com.manabihub.identity.service.CurrentUserService;
import com.manabihub.kyc.domain.TeacherProfile;
import com.manabihub.systemconfig.entity.SystemSetting;
import com.manabihub.systemconfig.repository.SystemSettingRepository;
import com.manabihub.wallet.dto.request.CreateWalletTopUpRequest;
import com.manabihub.wallet.dto.response.StudentWalletOverviewResponse;
import com.manabihub.wallet.dto.response.TeacherWalletOverviewResponse;
import com.manabihub.wallet.dto.response.WalletTopUpResponse;
import com.manabihub.wallet.dto.response.WalletTransactionResponse;
import com.manabihub.wallet.dto.response.WithdrawalRequestResponse;
import com.manabihub.wallet.entity.PayoutSettlement;
import com.manabihub.wallet.entity.Wallet;
import com.manabihub.wallet.entity.WalletTopUpRequest;
import com.manabihub.wallet.entity.WalletTransaction;
import com.manabihub.wallet.entity.WithdrawalRequest;
import com.manabihub.wallet.enums.EscrowStatus;
import com.manabihub.wallet.enums.WalletOwnerType;
import com.manabihub.wallet.enums.WalletTopUpStatus;
import com.manabihub.wallet.enums.WalletTransactionDirection;
import com.manabihub.wallet.enums.WalletTransactionType;
import com.manabihub.wallet.enums.WithdrawalRequestStatus;
import com.manabihub.wallet.repository.EscrowEntryRepository;
import com.manabihub.wallet.repository.PayoutSettlementRepository;
import com.manabihub.wallet.repository.WalletRepository;
import com.manabihub.wallet.repository.WalletTopUpRequestRepository;
import com.manabihub.wallet.repository.WalletTransactionRepository;
import com.manabihub.wallet.repository.WithdrawalRequestRepository;
import com.manabihub.wallet.service.WalletService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collection;
import java.util.EnumSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * UC-17 Manage My Wallet.
 *
 * <p>Business rules enforced here:
 * <ul>
 *   <li>BR-RBAC-01 — the wallet is always resolved from the authenticated
 *       principal, so a caller can only reach their own records.</li>
 *   <li>BR-ESC-01 / BR-ESC-02 — Pending Clearing escrow is reported separately
 *       from Available Balance and is never withdrawable.</li>
 *   <li>BR-WAL-01 — withdrawable balance excludes escrow and amounts already
 *       reserved by open withdrawal requests.</li>
 *   <li>BR-WAL-02 — a withdrawal is only offered above the payout threshold.</li>
 *   <li>BR-WAL-03 — a frozen wallet blocks the withdrawal action.</li>
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WalletServiceImpl implements WalletService {

    private static final String SETTING_PAYOUT_THRESHOLD = "PAYOUT_THRESHOLD";
    private static final String SETTING_MIN_TOP_UP = "WALLET_MIN_TOP_UP_AMOUNT";
    private static final BigDecimal DEFAULT_PAYOUT_THRESHOLD = new BigDecimal("100000");
    private static final BigDecimal DEFAULT_MIN_TOP_UP = new BigDecimal("50000");
    private static final String DEFAULT_CURRENCY = "VND";
    private static final String TOP_UP_REFERENCE_PREFIX = "TOPUP-";
    private static final int MAX_RECENT_TOP_UPS = 5;

    /** Open-ended bounds so an absent date filter needs no null comparison. */
    private static final Instant MIN_FILTER_INSTANT = Instant.EPOCH;
    private static final Instant MAX_FILTER_INSTANT = Instant.parse("9999-12-31T23:59:59Z");

    private final WalletRepository walletRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final WalletTopUpRequestRepository walletTopUpRequestRepository;
    private final EscrowEntryRepository escrowEntryRepository;
    private final WithdrawalRequestRepository withdrawalRequestRepository;
    private final PayoutSettlementRepository payoutSettlementRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final IdentityTeacherProfileRepository teacherProfileRepository;
    private final SystemSettingRepository systemSettingRepository;
    private final CurrentUserService currentUserService;

    // ────────────────────────────────────────────────────────────────────
    // Student view (UC-17 step 4)
    // ────────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public StudentWalletOverviewResponse getStudentWalletOverview() {
        StudentProfile student = resolveStudent();
        Wallet wallet = resolveStudentWallet(student);

        BigDecimal pendingTopUp = orZero(walletTopUpRequestRepository
                .sumAmountByStudentAndStatus(student.getId(), WalletTopUpStatus.PENDING));

        List<WalletTopUpResponse> recentTopUps = walletTopUpRequestRepository
                .findByStudent_IdOrderByCreatedAtDesc(
                        student.getId(),
                        PageRequest.of(0, MAX_RECENT_TOP_UPS))
                .getContent()
                .stream()
                .map(this::toTopUpResponse)
                .toList();

        return new StudentWalletOverviewResponse(
                wallet.getId(),
                wallet.getCurrency(),
                orZero(wallet.getBalance()),
                pendingTopUp,
                sumType(wallet, WalletTransactionType.TOP_UP),
                sumType(wallet, WalletTransactionType.PURCHASE),
                sumType(wallet, WalletTransactionType.REFUND),
                !wallet.isFrozen(),
                recentTopUps
        );
    }

    @Override
    public PageResponse<WalletTransactionResponse> getStudentTransactions(
            WalletTransactionType type,
            WalletTransactionDirection direction,
            Instant from,
            Instant to,
            Pageable pageable
    ) {
        Wallet wallet = findStudentWallet(resolveStudent()).orElse(null);
        return searchTransactions(
                wallet,
                WalletTransactionType.studentTypes(),
                type,
                direction,
                from,
                to,
                pageable
        );
    }

    @Override
    public PageResponse<WalletTopUpResponse> getStudentTopUps(Pageable pageable) {
        StudentProfile student = resolveStudent();
        Page<WalletTopUpResponse> page = walletTopUpRequestRepository
                .findByStudent_IdOrderByCreatedAtDesc(student.getId(), pageable)
                .map(this::toTopUpResponse);
        return PageResponse.from(page);
    }

    @Override
    @Transactional
    public WalletTopUpResponse createTopUpRequest(CreateWalletTopUpRequest request) {
        StudentProfile student = resolveStudent();
        Wallet wallet = resolveStudentWallet(student);

        if (wallet.isFrozen()) {
            throw new BusinessException(
                    MessageCodes.MSG_WALLET_003,
                    "Wallet is frozen and cannot be topped up.",
                    HttpStatus.CONFLICT
            );
        }

        BigDecimal minimum = readMoneySetting(SETTING_MIN_TOP_UP, DEFAULT_MIN_TOP_UP);
        if (request.amount().compareTo(minimum) < 0) {
            throw new BusinessException(
                    MessageCodes.WALLET_TOP_UP_BELOW_MINIMUM,
                    "Top-up amount is below the minimum of %s.".formatted(minimum.toPlainString()),
                    HttpStatus.BAD_REQUEST
            );
        }

        // One open request at a time keeps reconciliation unambiguous when the
        // gateway callback arrives (NFR-REL-06).
        if (walletTopUpRequestRepository
                .existsByStudent_IdAndStatus(student.getId(), WalletTopUpStatus.PENDING)) {
            throw new BusinessException(
                    MessageCodes.WALLET_TOP_UP_ALREADY_PENDING,
                    "A pending top-up request already exists.",
                    HttpStatus.CONFLICT
            );
        }

        WalletTopUpRequest topUp = walletTopUpRequestRepository.save(
                WalletTopUpRequest.builder()
                        .wallet(wallet)
                        .student(student)
                        .amount(request.amount())
                        .currency(wallet.getCurrency())
                        .status(WalletTopUpStatus.PENDING)
                        .referenceCode(generateReferenceCode())
                        .build()
        );

        log.info("UC-17: created wallet top-up {} for student {}",
                topUp.getReferenceCode(), student.getId());

        return toTopUpResponse(topUp);
    }

    // ────────────────────────────────────────────────────────────────────
    // Teacher view (UC-17 step 5)
    // ────────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public TeacherWalletOverviewResponse getTeacherWalletOverview() {
        TeacherProfile teacher = resolveTeacher();
        Wallet wallet = resolveTeacherWallet(teacher);

        BigDecimal available = orZero(wallet.getBalance());
        BigDecimal pendingEscrow = orZero(escrowEntryRepository
                .sumAmountByTeacherAndStatus(teacher.getId(), EscrowStatus.HELD));
        BigDecimal frozen = orZero(wallet.getFrozenBalance());
        BigDecimal reserved = orZero(withdrawalRequestRepository.sumAmountByTeacherAndStatuses(
                teacher.getId(),
                WithdrawalRequestStatus.reservingStatuses()));

        // BR-WAL-01: neither escrow nor reserved amounts may be withdrawn.
        BigDecimal withdrawable = available.subtract(reserved).max(BigDecimal.ZERO);
        BigDecimal threshold = readMoneySetting(SETTING_PAYOUT_THRESHOLD, DEFAULT_PAYOUT_THRESHOLD);

        String blockedMessageCode = resolveWithdrawalBlockReason(wallet, withdrawable, threshold);

        return new TeacherWalletOverviewResponse(
                wallet.getId(),
                wallet.getCurrency(),
                available,
                pendingEscrow,
                frozen,
                reserved,
                withdrawable,
                threshold,
                sumType(wallet, WalletTransactionType.REVENUE_SHARE)
                        .add(sumType(wallet, WalletTransactionType.ESCROW_RELEASE)),
                sumType(wallet, WalletTransactionType.PAYOUT),
                wallet.isFrozen(),
                blockedMessageCode == null,
                blockedMessageCode
        );
    }

    @Override
    public PageResponse<WalletTransactionResponse> getTeacherTransactions(
            WalletTransactionType type,
            WalletTransactionDirection direction,
            Instant from,
            Instant to,
            Pageable pageable
    ) {
        Wallet wallet = findTeacherWallet(resolveTeacher()).orElse(null);
        return searchTransactions(
                wallet,
                WalletTransactionType.teacherTypes(),
                type,
                direction,
                from,
                to,
                pageable
        );
    }

    @Override
    public PageResponse<WithdrawalRequestResponse> getTeacherWithdrawals(Pageable pageable) {
        TeacherProfile teacher = resolveTeacher();

        Page<WithdrawalRequest> page = withdrawalRequestRepository
                .findByTeacher_IdOrderByRequestedAtDesc(teacher.getId(), pageable);

        List<UUID> requestIds = page.getContent().stream()
                .map(WithdrawalRequest::getId)
                .toList();

        // Latest settlement per withdrawal, fetched in one query to avoid N+1.
        Map<UUID, PayoutSettlement> settlements = requestIds.isEmpty()
                ? Map.of()
                : payoutSettlementRepository
                        .findByWithdrawalRequest_IdInOrderByCreatedAtDesc(requestIds)
                        .stream()
                        .collect(Collectors.toMap(
                                settlement -> settlement.getWithdrawalRequest().getId(),
                                Function.identity(),
                                (first, ignored) -> first
                        ));

        return PageResponse.from(page.map(request -> toWithdrawalResponse(
                request,
                settlements.get(request.getId())
        )));
    }

    // ────────────────────────────────────────────────────────────────────
    // Internals
    // ────────────────────────────────────────────────────────────────────

    /**
     * BR-WAL-01/02/03 in one place. Returns the MSG code explaining why a
     * withdrawal is not offered, or {@code null} when it is allowed.
     */
    private String resolveWithdrawalBlockReason(
            Wallet wallet,
            BigDecimal withdrawable,
            BigDecimal threshold
    ) {
        if (wallet.isFrozen()) {
            return MessageCodes.MSG_WALLET_003;
        }
        if (withdrawable.compareTo(threshold) < 0) {
            return MessageCodes.MSG_WALLET_001;
        }
        return null;
    }

    private PageResponse<WalletTransactionResponse> searchTransactions(
            Wallet wallet,
            Set<WalletTransactionType> allowedTypes,
            WalletTransactionType requestedType,
            WalletTransactionDirection direction,
            Instant from,
            Instant to,
            Pageable pageable
    ) {
        // A role may only filter within the types it is allowed to see.
        if (requestedType != null && !allowedTypes.contains(requestedType)) {
            throw new BusinessException(
                    MessageCodes.WALLET_ACTION_NOT_ALLOWED_FOR_ROLE,
                    "Transaction type %s is not visible for this wallet."
                            .formatted(requestedType),
                    HttpStatus.FORBIDDEN
            );
        }

        // The wallet row is created lazily on the overview endpoint, which runs
        // in a writable transaction. This listing is read-only, so an absent
        // wallet simply means there is nothing to show yet.
        if (wallet == null) {
            return PageResponse.from(Page.<WalletTransactionResponse>empty(pageable));
        }

        Collection<WalletTransactionType> types = requestedType == null
                ? allowedTypes
                : Set.of(requestedType);
        Collection<WalletTransactionDirection> directions = direction == null
                ? EnumSet.allOf(WalletTransactionDirection.class)
                : Set.of(direction);

        Page<WalletTransactionResponse> page = walletTransactionRepository
                .search(
                        wallet.getId(),
                        types,
                        directions,
                        from == null ? MIN_FILTER_INSTANT : from,
                        to == null ? MAX_FILTER_INSTANT : to,
                        pageable)
                .map(this::toTransactionResponse);

        return PageResponse.from(page);
    }

    private StudentProfile resolveStudent() {
        return studentProfileRepository.findByUser_Id(currentUserService.getCurrentUserId())
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.WALLET_STUDENT_PROFILE_NOT_FOUND,
                        "Student profile was not found.",
                        HttpStatus.FORBIDDEN
                ));
    }

    private TeacherProfile resolveTeacher() {
        return teacherProfileRepository.findByUser_Id(currentUserService.getCurrentUserId())
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.WALLET_TEACHER_PROFILE_NOT_FOUND,
                        "Teacher profile was not found.",
                        HttpStatus.FORBIDDEN
                ));
    }

    private Optional<Wallet> findStudentWallet(StudentProfile student) {
        return walletRepository.findByStudent_Id(student.getId());
    }

    private Optional<Wallet> findTeacherWallet(TeacherProfile teacher) {
        return walletRepository.findByTeacher_Id(teacher.getId());
    }

    /**
     * Wallets are created lazily: a Student who never paid still has to be able
     * to open My Wallet (UC-17 postcondition 1). Only call this from a writable
     * transaction.
     */
    private Wallet resolveStudentWallet(StudentProfile student) {
        return findStudentWallet(student)
                .orElseGet(() -> walletRepository.save(Wallet.builder()
                        .ownerType(WalletOwnerType.STUDENT)
                        .student(student)
                        .balance(BigDecimal.ZERO)
                        .frozenBalance(BigDecimal.ZERO)
                        .currency(DEFAULT_CURRENCY)
                        .build()));
    }

    /** Writable-transaction counterpart of {@link #findTeacherWallet}. */
    private Wallet resolveTeacherWallet(TeacherProfile teacher) {
        return findTeacherWallet(teacher)
                .orElseGet(() -> walletRepository.save(Wallet.builder()
                        .ownerType(WalletOwnerType.TEACHER)
                        .teacher(teacher)
                        .balance(BigDecimal.ZERO)
                        .frozenBalance(BigDecimal.ZERO)
                        .currency(DEFAULT_CURRENCY)
                        .build()));
    }

    private BigDecimal sumType(Wallet wallet, WalletTransactionType type) {
        return orZero(walletTransactionRepository.sumAmountByType(wallet.getId(), type));
    }

    /**
     * Reads a NUMBER system setting, falling back to a safe default when the
     * row is missing or malformed so the wallet screen never fails to render.
     */
    private BigDecimal readMoneySetting(String key, BigDecimal fallback) {
        return systemSettingRepository.findBySettingKey(key)
                .map(SystemSetting::getSettingValue)
                .map(value -> {
                    try {
                        return new BigDecimal(value.trim());
                    } catch (NumberFormatException exception) {
                        log.warn("System setting {} is not a valid number: {}", key, value);
                        return fallback;
                    }
                })
                .orElse(fallback);
    }

    private String generateReferenceCode() {
        String code;
        do {
            code = TOP_UP_REFERENCE_PREFIX
                    + UUID.randomUUID().toString()
                            .replace("-", "")
                            .substring(0, 12)
                            .toUpperCase(Locale.ROOT);
        } while (walletTopUpRequestRepository.existsByReferenceCode(code));
        return code;
    }

    private static BigDecimal orZero(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private WalletTransactionResponse toTransactionResponse(WalletTransaction transaction) {
        return new WalletTransactionResponse(
                transaction.getId(),
                transaction.getTransactionType(),
                transaction.getDirection(),
                transaction.getAmount(),
                transaction.getBalanceAfter(),
                transaction.getReferenceType(),
                transaction.getReferenceId(),
                transaction.getNote(),
                transaction.getCreatedAt()
        );
    }

    private WalletTopUpResponse toTopUpResponse(WalletTopUpRequest topUp) {
        return new WalletTopUpResponse(
                topUp.getId(),
                topUp.getReferenceCode(),
                topUp.getAmount(),
                topUp.getCurrency(),
                topUp.getStatus(),
                topUp.getCreatedAt(),
                topUp.getConfirmedAt()
        );
    }

    private WithdrawalRequestResponse toWithdrawalResponse(
            WithdrawalRequest request,
            PayoutSettlement settlement
    ) {
        return new WithdrawalRequestResponse(
                request.getId(),
                request.getAmount(),
                request.getStatus(),
                request.getRequestedAt(),
                request.getDecidedAt(),
                request.getDecisionNote(),
                settlement == null ? null : settlement.getStatus(),
                settlement == null ? null : settlement.getProviderReferenceId(),
                settlement == null ? null : settlement.getExecutedAt()
        );
    }
}
