package com.manabihub.payout.service.impl;

import com.manabihub.kyc.domain.AppUser;
import com.manabihub.kyc.domain.TeacherProfile;
import com.manabihub.kyc.domain.UserStatus;
import com.manabihub.payout.entity.BankAccountSnapshot;
import com.manabihub.payout.entity.WithdrawalRequest;
import com.manabihub.payout.enums.ReconciliationStatus;
import com.manabihub.wallet.entity.Wallet;
import com.manabihub.wallet.entity.WalletTransaction;
import com.manabihub.wallet.enums.EscrowStatus;
import com.manabihub.wallet.enums.WalletDirection;
import com.manabihub.wallet.enums.WalletTransactionType;
import com.manabihub.wallet.repository.EscrowLedgerRepository;
import com.manabihub.wallet.repository.WalletTransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PayoutReconciliationServiceImplTest {

    @Mock private WalletTransactionRepository walletTransactionRepository;
    @Mock private EscrowLedgerRepository escrowLedgerRepository;

    private PayoutReconciliationServiceImpl service;
    private WithdrawalRequest request;
    private Wallet wallet;
    private TeacherProfile teacher;
    private WalletTransaction reservation;

    @BeforeEach
    void setUp() {
        UUID teacherId = UUID.randomUUID();
        UUID walletId = UUID.randomUUID();
        request = WithdrawalRequest.builder()
                .id(UUID.randomUUID())
                .teacherId(teacherId)
                .requestedAmount(new BigDecimal("500000.00"))
                .bankAccountSnapshot(validBank())
                .build();

        AppUser user = new AppUser();
        user.setId(UUID.randomUUID());
        user.setUserStatus(UserStatus.ACTIVE);
        teacher = new TeacherProfile();
        teacher.setId(teacherId);
        teacher.setUser(user);
        wallet = Wallet.builder()
                .id(walletId)
                .teacher(teacher)
                .ownerType(com.manabihub.wallet.enums.WalletOwnerType.TEACHER)
                .balance(new BigDecimal("1000000.00"))
                .frozenBalance(new BigDecimal("500000.00"))
                .currency("VND")
                .build();
        reservation = WalletTransaction.builder()
                .walletId(walletId)
                .amount(new BigDecimal("-500000.00"))
                .direction(WalletDirection.OUT)
                .transactionType(WalletTransactionType.WITHDRAWAL_RESERVATION)
                .build();

        when(walletTransactionRepository.findByReferenceTypeAndReferenceIdAndTransactionType(
                "WITHDRAWAL_REQUEST",
                request.getId(),
                WalletTransactionType.WITHDRAWAL_RESERVATION
        )).thenReturn(Optional.of(reservation));
        when(escrowLedgerRepository.sumAmountByTeacherIdAndStatus(
                teacherId,
                EscrowStatus.HELD
        )).thenReturn(BigDecimal.ZERO);
        service = new PayoutReconciliationServiceImpl(
                walletTransactionRepository,
                escrowLedgerRepository
        );
    }

    @Test
    void reconciliationMatchesConsistentAccounting() {
        var result = service.reconcile(request, wallet, teacher);

        assertEquals(ReconciliationStatus.MATCHED, result.status());
        assertTrue(result.alerts().isEmpty());
    }

    @Test
    void reconciliationBlocksWrongWalletLedger() {
        reservation.setWalletId(UUID.randomUUID());

        var result = service.reconcile(request, wallet, teacher);

        assertEquals(ReconciliationStatus.CRITICAL_MISMATCH, result.status());
        assertTrue(result.alerts().stream()
                .anyMatch(alert -> "PAYOUT_RESERVATION_LEDGER_MISMATCH".equals(alert.code())));
    }

    @Test
    void reconciliationWarnsButDoesNotBlockOtherPendingEscrow() {
        when(escrowLedgerRepository.sumAmountByTeacherIdAndStatus(
                request.getTeacherId(),
                EscrowStatus.HELD
        )).thenReturn(new BigDecimal("100000.00"));

        var result = service.reconcile(request, wallet, teacher);

        assertEquals(ReconciliationStatus.WARNING, result.status());
        assertEquals(0, result.pendingClearing().compareTo(new BigDecimal("100000.00")));
    }

    @Test
    void reconciliationBlocksLockedTeacher() {
        teacher.getUser().setUserStatus(UserStatus.LOCKED);

        var result = service.reconcile(request, wallet, teacher);

        assertEquals(ReconciliationStatus.CRITICAL_MISMATCH, result.status());
        assertTrue(result.teacherAccountBlocked());
    }

    @Test
    void reconciliationBlocksFrozenWallet() {
        wallet.setFrozen(true);

        var result = service.reconcile(request, wallet, teacher);

        assertEquals(ReconciliationStatus.CRITICAL_MISMATCH, result.status());
        assertTrue(result.alerts().stream()
                .anyMatch(alert -> "PAYOUT_WALLET_FROZEN".equals(alert.code())));
    }

    private BankAccountSnapshot validBank() {
        BankAccountSnapshot bank = new BankAccountSnapshot();
        bank.setBankName("Vietcombank");
        bank.setAccountHolderName("NGUYEN SENSEI");
        bank.setAccountNumber("0123456789");
        return bank;
    }
}
