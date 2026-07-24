package com.manabihub.payout.service.impl;

import com.manabihub.common.exception.BusinessException;
import com.manabihub.notification.service.NotificationService;
import com.manabihub.payout.dto.request.RejectPayoutRequest;
import com.manabihub.payout.entity.PayoutSettlement;
import com.manabihub.payout.entity.WithdrawalRequest;
import com.manabihub.payout.enums.PayoutStatus;
import com.manabihub.payout.enums.WithdrawalStatus;
import com.manabihub.payout.repository.PayoutSettlementRepository;
import com.manabihub.payout.repository.WithdrawalRequestRepository;
import com.manabihub.payout.service.PayoutGateway;
import com.manabihub.wallet.entity.TeacherWallet;
import com.manabihub.wallet.repository.TeacherWalletRepository;
import com.manabihub.wallet.repository.WalletLedgerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Consumer;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PayoutSettlementServiceImplTest {

    @Mock
    private WithdrawalRequestRepository withdrawalRequestRepository;
    @Mock
    private PayoutSettlementRepository payoutSettlementRepository;
    @Mock
    private TeacherWalletRepository teacherWalletRepository;
    @Mock
    private WalletLedgerRepository walletLedgerRepository;
    @Mock
    private NotificationService notificationService;
    @Mock
    private PayoutGateway payoutGateway;
    @Mock
    private TransactionTemplate transactionTemplate;

    @InjectMocks
    private PayoutSettlementServiceImpl service;

    private UUID reqId;
    private WithdrawalRequest request;
    private TeacherWallet wallet;
    private PayoutSettlement settlement;

    @BeforeEach
    void setUp() {
        reqId = UUID.randomUUID();
        
        request = new WithdrawalRequest();
        request.setId(reqId);
        request.setTeacherId(UUID.randomUUID());
        request.setWalletId(UUID.randomUUID());
        request.setAmount(new BigDecimal("1000000"));
        request.setStatus(WithdrawalStatus.PENDING_REVIEW);
        
        wallet = new TeacherWallet();
        wallet.setId(request.getWalletId());
        wallet.setTeacherId(request.getTeacherId());
        wallet.setAvailableBalance(new BigDecimal("500000"));
        wallet.setReservedBalance(new BigDecimal("1000000"));
        
        settlement = new PayoutSettlement();
        settlement.setId(UUID.randomUUID());
        settlement.setWithdrawalRequestId(reqId);
        settlement.setWalletId(wallet.getId());
        settlement.setAmount(request.getAmount());
    }

    @Test
    void testRejectPayout_Success() {
        when(withdrawalRequestRepository.findByIdWithLock(reqId)).thenReturn(Optional.of(request));
        when(teacherWalletRepository.findByIdWithLock(request.getWalletId())).thenReturn(Optional.of(wallet));
        when(payoutSettlementRepository.findByWithdrawalRequestId(reqId)).thenReturn(Optional.empty());

        RejectPayoutRequest rejectReq = new RejectPayoutRequest();
        rejectReq.setReason("Invalid bank");

        service.rejectPayout(reqId, rejectReq);

        assertEquals(WithdrawalStatus.REJECTED, request.getStatus());
        assertEquals(new BigDecimal("0"), wallet.getReservedBalance());
        assertEquals(new BigDecimal("1500000"), wallet.getAvailableBalance());
        
        verify(walletLedgerRepository, times(1)).save(any());
        verify(payoutSettlementRepository, times(1)).save(any());
        verify(notificationService, times(1)).createNotification(any(), any(), any(), any(), any());
    }
    
    @Test
    void testRejectPayout_AlreadyProcessed() {
        request.setStatus(WithdrawalStatus.PAID);
        when(withdrawalRequestRepository.findByIdWithLock(reqId)).thenReturn(Optional.of(request));
        
        RejectPayoutRequest rejectReq = new RejectPayoutRequest();
        rejectReq.setReason("Invalid bank");

        assertThrows(BusinessException.class, () -> service.rejectPayout(reqId, rejectReq));
    }
}
