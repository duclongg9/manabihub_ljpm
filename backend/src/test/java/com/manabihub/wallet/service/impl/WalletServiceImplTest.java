package com.manabihub.wallet.service.impl;

import com.manabihub.identity.entity.StudentProfile;
import com.manabihub.kyc.domain.TeacherProfile;
import com.manabihub.wallet.entity.Wallet;
import com.manabihub.wallet.entity.WalletTransaction;
import com.manabihub.wallet.enums.WalletDirection;
import com.manabihub.wallet.enums.WalletOwnerType;
import com.manabihub.wallet.enums.WalletTransactionType;
import com.manabihub.wallet.repository.WalletRepository;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WalletServiceImplTest {

    @Mock private WalletRepository walletRepository;
    @Mock private WalletTransactionRepository walletTransactionRepository;

    @InjectMocks
    private WalletServiceImpl service;

    private TeacherProfile teacher;
    private Wallet wallet;

    @BeforeEach
    void setUp() {
        teacher = new TeacherProfile();
        teacher.setId(UUID.randomUUID());
        wallet = Wallet.builder()
                .id(UUID.randomUUID())
                .ownerType(WalletOwnerType.TEACHER)
                .teacher(teacher)
                .balance(BigDecimal.ZERO)
                .frozenBalance(BigDecimal.ZERO)
                .build();
    }

    @Test
    void holdEscrow_incrementsFrozenBalanceAndRecordsEscrowHoldTransaction() {
        UUID referenceId = UUID.randomUUID();
        when(walletRepository.findByOwnerTypeAndTeacher_Id(WalletOwnerType.TEACHER, teacher.getId()))
                .thenReturn(Optional.of(wallet));
        when(walletRepository.findByIdForUpdate(wallet.getId())).thenReturn(Optional.of(wallet));
        when(walletTransactionRepository.save(any(WalletTransaction.class))).thenAnswer(inv -> inv.getArgument(0));

        WalletTransaction tx = service.holdEscrow(
                teacher, new BigDecimal("150000.00"), "ORDER", referenceId, "Escrow hold for order OD1");

        assertEquals(new BigDecimal("150000.00"), wallet.getFrozenBalance());
        assertEquals(BigDecimal.ZERO, wallet.getBalance());

        ArgumentCaptor<WalletTransaction> captor = ArgumentCaptor.forClass(WalletTransaction.class);
        verify(walletTransactionRepository).save(captor.capture());
        WalletTransaction saved = captor.getValue();
        assertEquals(WalletTransactionType.ESCROW_HOLD, saved.getTransactionType());
        assertEquals(WalletDirection.IN, saved.getDirection());
        assertEquals(new BigDecimal("150000.00"), saved.getAmount());
        assertEquals("ORDER", saved.getReferenceType());
        assertEquals(referenceId, saved.getReferenceId());
        assertEquals(tx, saved);
    }

    @Test
    void getOrCreateTeacherWallet_whenMissing_createsNewTeacherWallet() {
        when(walletRepository.findByOwnerTypeAndTeacher_Id(WalletOwnerType.TEACHER, teacher.getId()))
                .thenReturn(Optional.empty());
        when(walletRepository.save(any(Wallet.class))).thenAnswer(inv -> inv.getArgument(0));

        Wallet created = service.getOrCreateTeacherWallet(teacher);

        assertEquals(WalletOwnerType.TEACHER, created.getOwnerType());
        assertEquals(teacher, created.getTeacher());
    }

    @Test
    void getOrCreateStudentWallet_whenExists_returnsExistingWallet() {
        StudentProfile student = StudentProfile.builder().id(UUID.randomUUID()).build();
        Wallet studentWallet = Wallet.builder()
                .id(UUID.randomUUID())
                .ownerType(WalletOwnerType.STUDENT)
                .student(student)
                .build();
        when(walletRepository.findByOwnerTypeAndStudent_Id(WalletOwnerType.STUDENT, student.getId()))
                .thenReturn(Optional.of(studentWallet));

        Wallet result = service.getOrCreateStudentWallet(student);

        assertEquals(studentWallet, result);
    }

    @Test
    void getOrCreateStudentWallet_whenMissing_createsNewStudentWallet() {
        StudentProfile student = StudentProfile.builder().id(UUID.randomUUID()).build();
        when(walletRepository.findByOwnerTypeAndStudent_Id(WalletOwnerType.STUDENT, student.getId()))
                .thenReturn(Optional.empty());
        when(walletRepository.save(any(Wallet.class))).thenAnswer(inv -> inv.getArgument(0));

        Wallet created = service.getOrCreateStudentWallet(student);

        assertEquals(WalletOwnerType.STUDENT, created.getOwnerType());
        assertEquals(student, created.getStudent());
    }
}
