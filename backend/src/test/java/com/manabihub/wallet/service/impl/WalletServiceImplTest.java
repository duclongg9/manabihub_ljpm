package com.manabihub.wallet.service.impl;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.exception.BusinessException;
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
import com.manabihub.wallet.entity.Wallet;
import com.manabihub.wallet.entity.WalletTopUpRequest;
import com.manabihub.wallet.enums.EscrowStatus;
import com.manabihub.wallet.enums.WalletOwnerType;
import com.manabihub.wallet.enums.WalletTopUpStatus;
import com.manabihub.wallet.enums.WalletTransactionType;
import com.manabihub.wallet.repository.EscrowEntryRepository;
import com.manabihub.wallet.repository.PayoutSettlementRepository;
import com.manabihub.wallet.repository.WalletRepository;
import com.manabihub.wallet.repository.WalletTopUpRequestRepository;
import com.manabihub.wallet.repository.WalletTransactionRepository;
import com.manabihub.wallet.repository.WithdrawalRequestRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * UC-17 Manage My Wallet — business rule coverage.
 *
 * <p>Focuses on the rules a reviewer will look for:
 * BR-ESC-01/02 (Pending Clearing is separate), BR-WAL-01 (reserved amounts are
 * not withdrawable), BR-WAL-02 (payout threshold), BR-WAL-03 (frozen wallet)
 * and the role boundary on transaction filtering.
 */
@ExtendWith(MockitoExtension.class)
class WalletServiceImplTest {

    @Mock
    private WalletRepository walletRepository;
    @Mock
    private WalletTransactionRepository walletTransactionRepository;
    @Mock
    private WalletTopUpRequestRepository walletTopUpRequestRepository;
    @Mock
    private EscrowEntryRepository escrowEntryRepository;
    @Mock
    private WithdrawalRequestRepository withdrawalRequestRepository;
    @Mock
    private PayoutSettlementRepository payoutSettlementRepository;
    @Mock
    private StudentProfileRepository studentProfileRepository;
    @Mock
    private IdentityTeacherProfileRepository teacherProfileRepository;
    @Mock
    private SystemSettingRepository systemSettingRepository;
    @Mock
    private CurrentUserService currentUserService;

    @InjectMocks
    private WalletServiceImpl service;

    private UUID userId;
    private StudentProfile student;
    private TeacherProfile teacher;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();

        student = StudentProfile.builder()
                .id(UUID.randomUUID())
                .displayName("Học viên Demo")
                .build();

        teacher = new TeacherProfile();
        teacher.setId(UUID.randomUUID());
        teacher.setDisplayName("Giáo viên Demo");

        lenient().when(currentUserService.getCurrentUserId()).thenReturn(userId);
    }

    // ────────────────────────────────────────────────────────────────────
    // Teacher overview
    // ────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("BR-ESC-01/BR-WAL-01: escrow and reserved amounts are excluded from withdrawable balance")
    void teacherOverviewSeparatesPendingFromAvailable() {
        Wallet wallet = teacherWallet(new BigDecimal("500000"), BigDecimal.ZERO);
        stubTeacherWallet(wallet);

        when(escrowEntryRepository.sumAmountByTeacherAndStatus(teacher.getId(), EscrowStatus.HELD))
                .thenReturn(new BigDecimal("200000"));
        when(withdrawalRequestRepository.sumAmountByTeacherAndStatuses(
                eq(teacher.getId()), anyCollection()))
                .thenReturn(new BigDecimal("100000"));
        stubSetting("PAYOUT_THRESHOLD", "100000");
        stubTeacherLedgerTotals(wallet.getId());

        TeacherWalletOverviewResponse response = service.getTeacherWalletOverview();

        assertAmount("500000", response.availableBalance());
        assertAmount("200000", response.pendingEscrowAmount());
        assertAmount("100000", response.reservedByWithdrawals());
        // 500,000 available - 100,000 reserved; escrow never counts.
        assertAmount("400000", response.withdrawableBalance());
        assertTrue(response.canRequestWithdrawal());
        assertNull(response.blockedMessageCode());
    }

    @Test
    @DisplayName("BR-WAL-03: a frozen wallet blocks withdrawal with MSG-WALLET-003")
    void teacherOverviewBlocksWithdrawalWhenFrozen() {
        Wallet wallet = teacherWallet(new BigDecimal("500000"), new BigDecimal("500000"));
        stubTeacherWallet(wallet);

        when(escrowEntryRepository.sumAmountByTeacherAndStatus(teacher.getId(), EscrowStatus.HELD))
                .thenReturn(BigDecimal.ZERO);
        when(withdrawalRequestRepository.sumAmountByTeacherAndStatuses(
                eq(teacher.getId()), anyCollection()))
                .thenReturn(BigDecimal.ZERO);
        stubSetting("PAYOUT_THRESHOLD", "100000");
        stubTeacherLedgerTotals(wallet.getId());

        TeacherWalletOverviewResponse response = service.getTeacherWalletOverview();

        assertTrue(response.walletFrozen());
        assertFalse(response.canRequestWithdrawal());
        assertEquals(MessageCodes.MSG_WALLET_003, response.blockedMessageCode());
    }

    @Test
    @DisplayName("BR-WAL-02: balance below the payout threshold reports MSG-WALLET-001")
    void teacherOverviewBlocksWithdrawalBelowThreshold() {
        Wallet wallet = teacherWallet(new BigDecimal("40000"), BigDecimal.ZERO);
        stubTeacherWallet(wallet);

        when(escrowEntryRepository.sumAmountByTeacherAndStatus(teacher.getId(), EscrowStatus.HELD))
                .thenReturn(new BigDecimal("900000"));
        when(withdrawalRequestRepository.sumAmountByTeacherAndStatuses(
                eq(teacher.getId()), anyCollection()))
                .thenReturn(BigDecimal.ZERO);
        stubSetting("PAYOUT_THRESHOLD", "100000");
        stubTeacherLedgerTotals(wallet.getId());

        TeacherWalletOverviewResponse response = service.getTeacherWalletOverview();

        assertFalse(response.canRequestWithdrawal());
        assertEquals(MessageCodes.MSG_WALLET_001, response.blockedMessageCode());
    }

    @Test
    @DisplayName("BR-WAL-01: reserved amount larger than the balance never yields a negative withdrawable")
    void teacherOverviewClampsWithdrawableAtZero() {
        Wallet wallet = teacherWallet(new BigDecimal("100000"), BigDecimal.ZERO);
        stubTeacherWallet(wallet);

        when(escrowEntryRepository.sumAmountByTeacherAndStatus(teacher.getId(), EscrowStatus.HELD))
                .thenReturn(BigDecimal.ZERO);
        when(withdrawalRequestRepository.sumAmountByTeacherAndStatuses(
                eq(teacher.getId()), anyCollection()))
                .thenReturn(new BigDecimal("250000"));
        stubSetting("PAYOUT_THRESHOLD", "100000");
        stubTeacherLedgerTotals(wallet.getId());

        TeacherWalletOverviewResponse response = service.getTeacherWalletOverview();

        assertAmount("0", response.withdrawableBalance());
    }

    // ────────────────────────────────────────────────────────────────────
    // Student overview and top-up
    // ────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("UC-17 postcondition 1: a student without a wallet gets one created on first access")
    void studentOverviewCreatesWalletOnFirstAccess() {
        when(studentProfileRepository.findByUser_Id(userId)).thenReturn(Optional.of(student));
        when(walletRepository.findByStudent_Id(student.getId())).thenReturn(Optional.empty());
        when(walletRepository.save(any(Wallet.class))).thenAnswer(invocation -> {
            Wallet created = invocation.getArgument(0);
            created.setId(UUID.randomUUID());
            return created;
        });
        when(walletTopUpRequestRepository.sumAmountByStudentAndStatus(
                student.getId(), WalletTopUpStatus.PENDING))
                .thenReturn(BigDecimal.ZERO);
        when(walletTopUpRequestRepository.findByStudent_IdOrderByCreatedAtDesc(
                eq(student.getId()), any(PageRequest.class)))
                .thenReturn(emptyPage());
        when(walletTransactionRepository.sumAmountByType(any(UUID.class), any(WalletTransactionType.class)))
                .thenReturn(BigDecimal.ZERO);

        StudentWalletOverviewResponse response = service.getStudentWalletOverview();

        assertAmount("0", response.balance());
        assertTrue(response.canTopUp());
        assertTrue(response.recentTopUps().isEmpty());
        verify(walletRepository).save(any(Wallet.class));
    }

    @Test
    @DisplayName("NFR-SEC-14: creating a top-up records a PENDING request and never credits the balance")
    void createTopUpLeavesBalanceUntouched() {
        Wallet wallet = studentWallet(new BigDecimal("250000"), BigDecimal.ZERO);
        stubStudentWallet(wallet);
        stubSetting("WALLET_MIN_TOP_UP_AMOUNT", "50000");
        when(walletTopUpRequestRepository.existsByStudent_IdAndStatus(
                student.getId(), WalletTopUpStatus.PENDING))
                .thenReturn(false);
        when(walletTopUpRequestRepository.save(any(WalletTopUpRequest.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        WalletTopUpResponse response =
                service.createTopUpRequest(new CreateWalletTopUpRequest(new BigDecimal("100000")));

        assertEquals(WalletTopUpStatus.PENDING, response.status());
        assertAmount("100000", response.amount());
        assertTrue(response.referenceCode().startsWith("TOPUP-"));
        assertNull(response.confirmedAt());
        // The wallet row is untouched: only the request was persisted.
        assertAmount("250000", wallet.getBalance());
        verify(walletRepository, never()).save(any(Wallet.class));
    }

    @Test
    @DisplayName("Top-up below the configured minimum is rejected")
    void createTopUpRejectsAmountBelowMinimum() {
        stubStudentWallet(studentWallet(BigDecimal.ZERO, BigDecimal.ZERO));
        stubSetting("WALLET_MIN_TOP_UP_AMOUNT", "50000");

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> service.createTopUpRequest(new CreateWalletTopUpRequest(new BigDecimal("10000")))
        );

        assertEquals(MessageCodes.WALLET_TOP_UP_BELOW_MINIMUM, exception.getMessageCode());
        verify(walletTopUpRequestRepository, never()).save(any(WalletTopUpRequest.class));
    }

    @Test
    @DisplayName("NFR-REL-06: only one pending top-up may exist at a time")
    void createTopUpRejectsWhenAnotherIsPending() {
        stubStudentWallet(studentWallet(BigDecimal.ZERO, BigDecimal.ZERO));
        stubSetting("WALLET_MIN_TOP_UP_AMOUNT", "50000");
        when(walletTopUpRequestRepository.existsByStudent_IdAndStatus(
                student.getId(), WalletTopUpStatus.PENDING))
                .thenReturn(true);

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> service.createTopUpRequest(new CreateWalletTopUpRequest(new BigDecimal("100000")))
        );

        assertEquals(MessageCodes.WALLET_TOP_UP_ALREADY_PENDING, exception.getMessageCode());
    }

    @Test
    @DisplayName("BR-WAL-03: a frozen wallet cannot be topped up")
    void createTopUpRejectedWhenWalletFrozen() {
        stubStudentWallet(studentWallet(BigDecimal.ZERO, new BigDecimal("100000")));

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> service.createTopUpRequest(new CreateWalletTopUpRequest(new BigDecimal("100000")))
        );

        assertEquals(MessageCodes.MSG_WALLET_003, exception.getMessageCode());
    }

    // ────────────────────────────────────────────────────────────────────
    // Role boundary on the transaction history
    // ────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("BR-RBAC-01: a Student cannot filter the history by a Teacher revenue type")
    void studentCannotFilterByTeacherTransactionType() {
        stubStudentWallet(studentWallet(BigDecimal.ZERO, BigDecimal.ZERO));

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> service.getStudentTransactions(
                        WalletTransactionType.REVENUE_SHARE,
                        null,
                        null,
                        null,
                        PageRequest.of(0, 10))
        );

        assertEquals(MessageCodes.WALLET_ACTION_NOT_ALLOWED_FOR_ROLE, exception.getMessageCode());
    }

    @Test
    @DisplayName("BR-RBAC-01: an unfiltered Student query is scoped to Student transaction types only")
    void studentHistoryIsScopedToStudentTypes() {
        Wallet wallet = studentWallet(BigDecimal.ZERO, BigDecimal.ZERO);
        stubStudentWallet(wallet);
        when(walletTransactionRepository.search(
                eq(wallet.getId()), anyCollection(), anyCollection(), any(), any(), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of()));

        service.getStudentTransactions(null, null, null, null, PageRequest.of(0, 10));

        verify(walletTransactionRepository).search(
                eq(wallet.getId()),
                eq(WalletTransactionType.studentTypes()),
                anyCollection(),
                any(),
                any(),
                any(PageRequest.class));
    }

    // ────────────────────────────────────────────────────────────────────
    // Helpers
    // ────────────────────────────────────────────────────────────────────

    private Wallet studentWallet(BigDecimal balance, BigDecimal frozen) {
        return Wallet.builder()
                .id(UUID.randomUUID())
                .ownerType(WalletOwnerType.STUDENT)
                .student(student)
                .balance(balance)
                .frozenBalance(frozen)
                .currency("VND")
                .build();
    }

    private Wallet teacherWallet(BigDecimal balance, BigDecimal frozen) {
        return Wallet.builder()
                .id(UUID.randomUUID())
                .ownerType(WalletOwnerType.TEACHER)
                .teacher(teacher)
                .balance(balance)
                .frozenBalance(frozen)
                .currency("VND")
                .build();
    }

    private void stubStudentWallet(Wallet wallet) {
        when(studentProfileRepository.findByUser_Id(userId)).thenReturn(Optional.of(student));
        when(walletRepository.findByStudent_Id(student.getId())).thenReturn(Optional.of(wallet));
    }

    private void stubTeacherWallet(Wallet wallet) {
        when(teacherProfileRepository.findByUser_Id(userId)).thenReturn(Optional.of(teacher));
        when(walletRepository.findByTeacher_Id(teacher.getId())).thenReturn(Optional.of(wallet));
    }

    private void stubSetting(String key, String value) {
        when(systemSettingRepository.findBySettingKey(key)).thenReturn(Optional.of(
                SystemSetting.builder()
                        .id(UUID.randomUUID())
                        .settingKey(key)
                        .settingValue(value)
                        .valueType("NUMBER")
                        .build()
        ));
    }

    private void stubTeacherLedgerTotals(UUID walletId) {
        when(walletTransactionRepository.sumAmountByType(eq(walletId), any(WalletTransactionType.class)))
                .thenReturn(BigDecimal.ZERO);
    }

    private Page<WalletTopUpRequest> emptyPage() {
        return new PageImpl<>(List.of());
    }

    private void assertAmount(String expected, BigDecimal actual) {
        assertEquals(0, new BigDecimal(expected).compareTo(actual),
                () -> "expected " + expected + " but was " + actual);
    }
}
