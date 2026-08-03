package com.manabihub.wallet.service.impl;

import com.manabihub.common.exception.BusinessException;
import com.manabihub.identity.repository.StudentProfileRepository;
import com.manabihub.wallet.entity.Wallet;
import com.manabihub.wallet.entity.WalletPaymentReservation;
import com.manabihub.wallet.entity.WalletTransaction;
import com.manabihub.wallet.enums.WalletDirection;
import com.manabihub.wallet.enums.WalletOwnerType;
import com.manabihub.wallet.enums.WalletReservationStatus;
import com.manabihub.wallet.enums.WalletTransactionType;
import com.manabihub.wallet.repository.WalletPaymentReservationRepository;
import com.manabihub.wallet.repository.WalletRepository;
import com.manabihub.wallet.repository.WalletTransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StudentWalletServiceImplTest {

    @Mock private WalletRepository walletRepository;
    @Mock private WalletTransactionRepository walletTransactionRepository;
    @Mock private WalletPaymentReservationRepository reservationRepository;
    @Mock private StudentProfileRepository studentProfileRepository;

    private StudentWalletServiceImpl service;
    private UUID studentId;
    private Wallet wallet;

    @BeforeEach
    void setUp() {
        service = new StudentWalletServiceImpl(
                walletRepository,
                walletTransactionRepository,
                reservationRepository,
                studentProfileRepository);
        studentId = UUID.randomUUID();
        wallet = Wallet.builder()
                .id(UUID.randomUUID())
                .ownerType(WalletOwnerType.STUDENT)
                .balance(new BigDecimal("100000.00"))
                .frozenBalance(BigDecimal.ZERO)
                .currency("VND")
                .build();
    }

    @Test
    void getOrCreateStudentWallet_usesAtomicInsertAndReturnsCanonicalWallet() {
        when(walletRepository.findByOwnerTypeAndStudent_Id(WalletOwnerType.STUDENT, studentId))
                .thenReturn(Optional.of(wallet));

        assertSame(wallet, service.getOrCreateStudentWallet(studentId));

        verify(walletRepository).insertStudentWalletIfAbsent(any(UUID.class), eq(studentId));
    }

    @Test
    void creditTopUp_increasesBalanceAndWritesIdempotentLedger() {
        UUID orderId = UUID.randomUUID();
        stubExistingWallet();
        when(walletTransactionRepository.findByIdempotencyKey("wallet-topup:" + orderId))
                .thenReturn(Optional.empty());
        when(walletTransactionRepository.save(any(WalletTransaction.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        WalletTransaction transaction = service.creditTopUp(
                studentId, new BigDecimal("50000.00"), orderId, "Top up");

        assertEquals(new BigDecimal("150000.00"), wallet.getBalance());
        assertEquals(WalletTransactionType.TOP_UP, transaction.getTransactionType());
        assertEquals(WalletDirection.IN, transaction.getDirection());
        assertEquals("wallet-topup:" + orderId, transaction.getIdempotencyKey());
        verify(walletRepository).save(wallet);
    }

    @Test
    void creditRefund_replayReturnsExistingLedgerWithoutCreditingTwice() {
        UUID refundId = UUID.randomUUID();
        WalletTransaction existing = WalletTransaction.builder().id(UUID.randomUUID()).build();
        when(walletTransactionRepository.findByIdempotencyKey("wallet-refund:" + refundId))
                .thenReturn(Optional.of(existing));

        assertSame(existing, service.creditRefund(
                studentId, new BigDecimal("250000.00"), refundId, "Refund"));

        assertEquals(new BigDecimal("100000.00"), wallet.getBalance());
        verify(walletRepository, never()).save(any());
    }

    @Test
    void reserveForOrder_freezesOnlyAvailableFunds() {
        UUID orderId = UUID.randomUUID();
        wallet.setFrozenBalance(new BigDecimal("20000.00"));
        stubExistingWallet();
        when(reservationRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.empty());
        when(reservationRepository.save(any(WalletPaymentReservation.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        WalletPaymentReservation reservation = service.reserveForOrder(
                studentId, orderId, new BigDecimal("70000.00"), Instant.now().plusSeconds(60));

        assertEquals(new BigDecimal("90000.00"), wallet.getFrozenBalance());
        assertEquals(WalletReservationStatus.RESERVED, reservation.getStatus());
        assertEquals(new BigDecimal("70000.00"), reservation.getAmount());
    }

    @Test
    void reserveForOrder_rejectsAmountGreaterThanAvailableBalance() {
        UUID orderId = UUID.randomUUID();
        wallet.setFrozenBalance(new BigDecimal("20000.00"));
        stubExistingWallet();
        when(reservationRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.empty());

        assertThrows(BusinessException.class, () -> service.reserveForOrder(
                studentId, orderId, new BigDecimal("90000.00"), Instant.now().plusSeconds(60)));

        assertEquals(new BigDecimal("20000.00"), wallet.getFrozenBalance());
        verify(reservationRepository, never()).save(any());
    }

    @Test
    void captureForOrder_debitsBalanceAndFrozenBalanceExactlyOnce() {
        UUID orderId = UUID.randomUUID();
        String key = "wallet-purchase:" + orderId;
        wallet.setFrozenBalance(new BigDecimal("30000.00"));
        WalletPaymentReservation reservation = WalletPaymentReservation.builder()
                .walletId(wallet.getId())
                .orderId(orderId)
                .amount(new BigDecimal("30000.00"))
                .status(WalletReservationStatus.RESERVED)
                .expiresAt(Instant.now().plusSeconds(60))
                .build();
        when(walletTransactionRepository.findByIdempotencyKey(key)).thenReturn(Optional.empty());
        when(reservationRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(reservation));
        when(walletRepository.findByIdForUpdate(wallet.getId())).thenReturn(Optional.of(wallet));
        when(walletTransactionRepository.save(any(WalletTransaction.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        WalletTransaction transaction = service.captureForOrder(orderId, Instant.now());

        assertEquals(new BigDecimal("70000.00"), wallet.getBalance());
        assertEquals(new BigDecimal("0.00"), wallet.getFrozenBalance());
        assertEquals(WalletReservationStatus.CAPTURED, reservation.getStatus());
        assertEquals(key, transaction.getIdempotencyKey());
        assertEquals(WalletTransactionType.PURCHASE, transaction.getTransactionType());
    }

    @Test
    void releaseForOrder_unfreezesFundsAndIsIdempotent() {
        UUID orderId = UUID.randomUUID();
        wallet.setFrozenBalance(new BigDecimal("30000.00"));
        WalletPaymentReservation reservation = WalletPaymentReservation.builder()
                .walletId(wallet.getId())
                .orderId(orderId)
                .amount(new BigDecimal("30000.00"))
                .status(WalletReservationStatus.RESERVED)
                .expiresAt(Instant.now().plusSeconds(60))
                .build();
        when(reservationRepository.findByOrderIdForUpdate(orderId))
                .thenReturn(Optional.of(reservation));
        when(walletRepository.findByIdForUpdate(wallet.getId())).thenReturn(Optional.of(wallet));

        service.releaseForOrder(orderId, Instant.now());
        service.releaseForOrder(orderId, Instant.now());

        assertEquals(new BigDecimal("0.00"), wallet.getFrozenBalance());
        assertEquals(WalletReservationStatus.RELEASED, reservation.getStatus());
        verify(walletRepository).save(wallet);
    }

    private void stubExistingWallet() {
        when(walletRepository.findByOwnerTypeAndStudent_Id(WalletOwnerType.STUDENT, studentId))
                .thenReturn(Optional.of(wallet));
        when(walletRepository.findStudentWalletForUpdate(studentId)).thenReturn(Optional.of(wallet));
    }
}
