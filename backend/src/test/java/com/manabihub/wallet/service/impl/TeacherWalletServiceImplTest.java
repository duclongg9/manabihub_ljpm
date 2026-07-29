package com.manabihub.wallet.service.impl;

import com.manabihub.identity.service.CurrentUserService;
import com.manabihub.kyc.domain.TeacherProfile;
import com.manabihub.kyc.repository.TeacherProfileRepository;
import com.manabihub.wallet.dto.response.EscrowEntryResponse;
import com.manabihub.wallet.dto.response.TeacherWalletSummaryResponse;
import com.manabihub.wallet.dto.response.WalletActivityResponse;
import com.manabihub.wallet.entity.EscrowLedger;
import com.manabihub.wallet.entity.Wallet;
import com.manabihub.wallet.entity.WalletTransaction;
import com.manabihub.wallet.enums.EscrowStatus;
import com.manabihub.wallet.enums.PayoutStatus;
import com.manabihub.wallet.enums.WalletDirection;
import com.manabihub.wallet.enums.WalletOwnerType;
import com.manabihub.wallet.enums.WalletTransactionType;
import com.manabihub.wallet.mapper.EscrowLedgerMapper;
import com.manabihub.wallet.mapper.WalletTransactionMapper;
import com.manabihub.wallet.repository.WalletTransactionRepository;
import com.manabihub.wallet.service.EscrowService;
import com.manabihub.wallet.service.WalletService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TeacherWalletServiceImplTest {

    @Mock private WalletService walletService;
    @Mock private EscrowService escrowService;
    @Mock private WalletTransactionRepository walletTransactionRepository;
    @Mock private TeacherProfileRepository teacherProfileRepository;
    @Mock private CurrentUserService currentUserService;

    private TeacherWalletServiceImpl service;

    private UUID userId;
    private TeacherProfile teacher;

    @BeforeEach
    void setUp() {
        service = new TeacherWalletServiceImpl(
                walletService, escrowService, walletTransactionRepository, teacherProfileRepository,
                currentUserService, new WalletTransactionMapper(), new EscrowLedgerMapper());

        userId = UUID.randomUUID();
        teacher = new TeacherProfile();
        teacher.setId(UUID.randomUUID());

        when(currentUserService.getCurrentUserId()).thenReturn(userId);
        when(teacherProfileRepository.findByUserId(userId)).thenReturn(Optional.of(teacher));
    }

    @Test
    void getWalletSummary_whenFrozenBalancePositive_isEscrowPending() {
        Wallet wallet = wallet(new BigDecimal("50000.00"), new BigDecimal("150000.00"));
        when(walletService.getOrCreateTeacherWallet(teacher)).thenReturn(wallet);
        when(walletTransactionRepository.findByWallet_IdOrderByCreatedAtDesc(wallet.getId()))
                .thenReturn(List.of(payoutTransaction(wallet, new BigDecimal("40000.00"))));

        TeacherWalletSummaryResponse summary = service.getWalletSummary();

        assertEquals(PayoutStatus.ESCROW_PENDING, summary.payoutStatus());
        assertEquals(new BigDecimal("50000.00"), summary.availableBalance());
        assertEquals(new BigDecimal("150000.00"), summary.pendingEscrowBalance());
        assertEquals(new BigDecimal("40000.00"), summary.totalWithdrawn());
    }

    @Test
    void getWalletSummary_whenNoFrozenButPositiveBalance_isAvailableForPayout() {
        Wallet wallet = wallet(new BigDecimal("70000.00"), BigDecimal.ZERO);
        when(walletService.getOrCreateTeacherWallet(teacher)).thenReturn(wallet);
        when(walletTransactionRepository.findByWallet_IdOrderByCreatedAtDesc(wallet.getId()))
                .thenReturn(List.of());

        assertEquals(PayoutStatus.AVAILABLE_FOR_PAYOUT, service.getWalletSummary().payoutStatus());
    }

    @Test
    void getWalletSummary_whenNothingHeldOrAvailable_isNoActivity() {
        Wallet wallet = wallet(BigDecimal.ZERO, BigDecimal.ZERO);
        when(walletService.getOrCreateTeacherWallet(teacher)).thenReturn(wallet);
        when(walletTransactionRepository.findByWallet_IdOrderByCreatedAtDesc(wallet.getId()))
                .thenReturn(List.of());

        assertEquals(PayoutStatus.NO_ACTIVITY, service.getWalletSummary().payoutStatus());
    }

    @Test
    void getPendingEscrow_delegatesToEscrowService() {
        EscrowLedger ledger = EscrowLedger.builder()
                .id(UUID.randomUUID())
                .teacher(teacher)
                .amount(new BigDecimal("150000.00"))
                .status(EscrowStatus.HELD)
                .createdAt(Instant.now())
                .build();
        when(escrowService.findPendingEscrowForTeacher(teacher)).thenReturn(List.of(ledger));

        List<EscrowEntryResponse> result = service.getPendingEscrow();

        assertEquals(1, result.size());
        assertEquals(EscrowStatus.HELD, result.get(0).status());
        assertEquals(new BigDecimal("150000.00"), result.get(0).amount());
    }

    @Test
    void getWithdrawalHistory_onlyReturnsPayoutTransactions() {
        Wallet wallet = wallet(new BigDecimal("10000.00"), BigDecimal.ZERO);
        when(walletService.getOrCreateTeacherWallet(teacher)).thenReturn(wallet);
        when(walletTransactionRepository.findByWallet_IdOrderByCreatedAtDesc(wallet.getId()))
                .thenReturn(List.of(
                        payoutTransaction(wallet, new BigDecimal("40000.00")),
                        escrowHoldTransaction(wallet, new BigDecimal("60000.00"))
                ));

        List<WalletActivityResponse> history = service.getWithdrawalHistory();

        assertEquals(1, history.size());
        assertEquals(new BigDecimal("40000.00"), history.get(0).amount());
    }

    private Wallet wallet(BigDecimal balance, BigDecimal frozenBalance) {
        return Wallet.builder()
                .id(UUID.randomUUID())
                .ownerType(WalletOwnerType.TEACHER)
                .teacher(teacher)
                .balance(balance)
                .frozenBalance(frozenBalance)
                .currency("VND")
                .updatedAt(Instant.now())
                .build();
    }

    private WalletTransaction payoutTransaction(Wallet wallet, BigDecimal amount) {
        return WalletTransaction.builder()
                .id(UUID.randomUUID())
                .wallet(wallet)
                .transactionType(WalletTransactionType.PAYOUT)
                .amount(amount)
                .direction(WalletDirection.OUT)
                .createdAt(Instant.now())
                .build();
    }

    private WalletTransaction escrowHoldTransaction(Wallet wallet, BigDecimal amount) {
        return WalletTransaction.builder()
                .id(UUID.randomUUID())
                .wallet(wallet)
                .transactionType(WalletTransactionType.ESCROW_HOLD)
                .amount(amount)
                .direction(WalletDirection.IN)
                .createdAt(Instant.now())
                .build();
    }
}
