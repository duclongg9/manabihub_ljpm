package com.manabihub.wallet.service.impl;

import com.manabihub.common.exception.BusinessException;
import com.manabihub.identity.repository.StudentProfileRepository;
import com.manabihub.wallet.entity.StudentWallet;
import com.manabihub.wallet.entity.WalletTransaction;
import com.manabihub.wallet.enums.WalletDirection;
import com.manabihub.wallet.enums.WalletTransactionType;
import com.manabihub.wallet.repository.StudentWalletRepository;
import com.manabihub.wallet.repository.WalletTransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StudentWalletServiceImplTest {

    @Mock private StudentWalletRepository studentWalletRepository;
    @Mock private WalletTransactionRepository walletTransactionRepository;
    @Mock private StudentProfileRepository studentProfileRepository;

    @InjectMocks
    private StudentWalletServiceImpl service;

    private UUID studentId;
    private StudentWallet wallet;

    @BeforeEach
    void setUp() {
        studentId = UUID.randomUUID();
        wallet = StudentWallet.builder()
                .id(UUID.randomUUID())
                .studentId(studentId)
                .balance(BigDecimal.ZERO)
                .frozenBalance(BigDecimal.ZERO)
                .build();
    }

    @Test
    void creditBalance_increasesBalanceAndRecordsTopUpTransaction() {
        UUID referenceId = UUID.randomUUID();
        when(studentWalletRepository.findByStudentId(studentId)).thenReturn(Optional.of(wallet));
        when(studentWalletRepository.findByStudentIdForUpdate(studentId)).thenReturn(Optional.of(wallet));
        when(walletTransactionRepository.save(any(WalletTransaction.class))).thenAnswer(inv -> inv.getArgument(0));

        WalletTransaction tx = service.creditBalance(
                studentId, new BigDecimal("50000"), "WALLET_TOPUP", referenceId, "Nạp ví qua đơn OD1");

        assertEquals(new BigDecimal("50000"), wallet.getBalance());

        ArgumentCaptor<WalletTransaction> captor = ArgumentCaptor.forClass(WalletTransaction.class);
        verify(walletTransactionRepository).save(captor.capture());
        WalletTransaction saved = captor.getValue();
        assertEquals(WalletTransactionType.TOP_UP, saved.getTransactionType());
        assertEquals(WalletDirection.IN, saved.getDirection());
        assertEquals(new BigDecimal("50000"), saved.getAmount());
        assertEquals("WALLET_TOPUP", saved.getReferenceType());
        assertEquals(referenceId, saved.getReferenceId());
        assertEquals(wallet.getId(), saved.getWalletId());
        assertEquals(tx, saved);
    }

    @Test
    void debitBalance_sufficientBalance_decreasesBalanceAndRecordsPurchase() {
        wallet.setBalance(new BigDecimal("100000"));
        when(studentWalletRepository.findByStudentId(studentId)).thenReturn(Optional.of(wallet));
        when(studentWalletRepository.findByStudentIdForUpdate(studentId)).thenReturn(Optional.of(wallet));
        when(walletTransactionRepository.save(any(WalletTransaction.class))).thenAnswer(inv -> inv.getArgument(0));

        service.debitBalance(studentId, new BigDecimal("30000"), "ORDER", UUID.randomUUID(), "Mua khoá học");

        assertEquals(new BigDecimal("70000"), wallet.getBalance());
        ArgumentCaptor<WalletTransaction> captor = ArgumentCaptor.forClass(WalletTransaction.class);
        verify(walletTransactionRepository).save(captor.capture());
        assertEquals(WalletTransactionType.PURCHASE, captor.getValue().getTransactionType());
        assertEquals(WalletDirection.OUT, captor.getValue().getDirection());
    }

    @Test
    void debitBalance_insufficientBalance_throwsAndDoesNotDeduct() {
        wallet.setBalance(new BigDecimal("10000"));
        when(studentWalletRepository.findByStudentId(studentId)).thenReturn(Optional.of(wallet));
        when(studentWalletRepository.findByStudentIdForUpdate(studentId)).thenReturn(Optional.of(wallet));

        assertThrows(BusinessException.class, () ->
                service.debitBalance(studentId, new BigDecimal("50000"), "ORDER", UUID.randomUUID(), "Mua khoá học"));

        assertEquals(new BigDecimal("10000"), wallet.getBalance());
        verify(walletTransactionRepository, never()).save(any());
    }

    @Test
    void getOrCreateStudentWallet_whenMissing_createsNewStudentWallet() {
        when(studentWalletRepository.findByStudentId(studentId)).thenReturn(Optional.empty());
        when(studentWalletRepository.save(any(StudentWallet.class))).thenAnswer(inv -> inv.getArgument(0));

        StudentWallet created = service.getOrCreateStudentWallet(studentId);

        assertEquals("STUDENT", created.getOwnerType());
        assertEquals(studentId, created.getStudentId());
    }
}
