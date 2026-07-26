package com.manabihub.wallet.service.impl;

import com.manabihub.kyc.domain.TeacherProfile;
import com.manabihub.kyc.repository.TeacherProfileRepository;
import com.manabihub.wallet.dto.response.TeacherWalletResponse;
import com.manabihub.wallet.entity.TeacherWallet;
import com.manabihub.wallet.entity.Wallet;
import com.manabihub.wallet.entity.WalletTransaction;
import com.manabihub.wallet.enums.WalletDirection;
import com.manabihub.wallet.enums.WalletOwnerType;
import com.manabihub.wallet.enums.WalletTransactionType;
import com.manabihub.wallet.mapper.WalletMapper;
import com.manabihub.wallet.repository.TeacherWalletRepository;
import com.manabihub.wallet.repository.WalletRepository;
import com.manabihub.wallet.repository.WalletTransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WalletServiceImplTest {

    @Mock private TeacherWalletRepository teacherWalletRepository;
    @Mock private TeacherProfileRepository teacherProfileRepository;
    @Mock private WalletRepository walletRepository;
    @Mock private WalletTransactionRepository walletTransactionRepository;
    @Mock private WalletMapper walletMapper;

    @InjectMocks
    private WalletServiceImpl service;

    private TeacherProfile teacher;
    private Wallet wallet;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(service, "minimumPayoutAmount", new BigDecimal("500000.00"));
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
    void getTeacherWalletByUserId_resolvesTeacherProfileBeforeWalletLookup() {
        UUID userId = UUID.randomUUID();
        TeacherWallet teacherWallet = TeacherWallet.builder()
                .id(UUID.randomUUID())
                .teacherId(teacher.getId())
                .balance(new BigDecimal("5000000.00"))
                .frozenBalance(BigDecimal.ZERO)
                .build();
        TeacherWalletResponse expected = new TeacherWalletResponse();

        when(teacherProfileRepository.findByUserId(userId)).thenReturn(Optional.of(teacher));
        when(teacherWalletRepository.findByTeacherId(teacher.getId())).thenReturn(Optional.of(teacherWallet));
        when(walletMapper.toResponse(
                eq(teacherWallet),
                any(BigDecimal.class),
                anyInt(),
                any(LocalDate.class)))
                .thenReturn(expected);

        TeacherWalletResponse actual = service.getTeacherWalletByUserId(userId);

        assertSame(expected, actual);
        verify(teacherProfileRepository).findByUserId(userId);
        verify(teacherWalletRepository).findByTeacherId(teacher.getId());
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
}
