package com.manabihub.wallet.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
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
import com.manabihub.wallet.enums.WalletOwnerType;
import com.manabihub.wallet.enums.WalletTopUpStatus;
import com.manabihub.wallet.enums.WalletTransactionType;
import com.manabihub.wallet.repository.WalletTopUpRepository;
import com.manabihub.wallet.service.WalletService;
import com.manabihub.wallet.service.WalletTopUpService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * UC-17 alternative flow 4a. The behaviour worth protecting here is that the wallet balance
 * moves only when a checksum-verified callback matches an uncredited top-up of exactly the
 * recorded amount — everything else must leave the balance alone.
 */
@ExtendWith(MockitoExtension.class)
class WalletTopUpServiceImplTest {

    private static final String TOPUP_CODE = "TU202607300001";

    @Mock private WalletTopUpRepository walletTopUpRepository;
    @Mock private WalletService walletService;
    @Mock private StudentProfileRepository studentProfileRepository;
    @Mock private CurrentUserService currentUserService;
    @Mock private PaymentGateway paymentGateway;
    @Mock private NotificationService notificationService;

    private WalletTopUpServiceImpl service;

    private StudentProfile student;
    private Wallet wallet;
    private WalletTopUp topUp;

    private final Map<String, String> params = Map.of("vnp_TxnRef", TOPUP_CODE);

    @BeforeEach
    void setUp() {
        VnPayProperties properties = new VnPayProperties();
        service = new WalletTopUpServiceImpl(
                walletTopUpRepository, walletService, studentProfileRepository, currentUserService,
                paymentGateway, properties, notificationService, new ObjectMapper());

        AppUser user = AppUser.builder().id(UUID.randomUUID()).email("student@test.dev").build();
        student = StudentProfile.builder().id(UUID.randomUUID()).user(user).build();
        wallet = Wallet.builder()
                .id(UUID.randomUUID())
                .ownerType(WalletOwnerType.STUDENT)
                .student(student)
                .balance(BigDecimal.ZERO)
                .frozenBalance(BigDecimal.ZERO)
                .currency("VND")
                .build();
        topUp = WalletTopUp.builder()
                .id(UUID.randomUUID())
                .wallet(wallet)
                .student(student)
                .topUpCode(TOPUP_CODE)
                .amount(new BigDecimal("100000.00"))
                .currency("VND")
                .status(WalletTopUpStatus.PENDING)
                .provider("VNPAY")
                .build();
    }

    // ── create ──────────────────────────────────────────────────────────────

    @Test
    void createTopUp_recordsPendingRequestAgainstOwnWalletAndReturnsPaymentUrl() {
        stubCurrentStudent();
        when(walletService.getOrCreateStudentWallet(student)).thenReturn(wallet);
        when(paymentGateway.getProvider()).thenReturn("VNPAY");
        when(walletTopUpRepository.existsByTopUpCode(anyString())).thenReturn(false);
        when(walletTopUpRepository.save(any(WalletTopUp.class))).thenAnswer(inv -> inv.getArgument(0));
        when(paymentGateway.buildPaymentUrl(any(PaymentIntent.class), eq("1.2.3.4")))
                .thenReturn("https://sandbox.vnpayment.vn/pay?x=1");

        WalletTopUpResponse response = service.createTopUp(
                new CreateTopUpRequest(new BigDecimal("100000")), "1.2.3.4");

        ArgumentCaptor<WalletTopUp> saved = ArgumentCaptor.forClass(WalletTopUp.class);
        verify(walletTopUpRepository).save(saved.capture());
        assertEquals(WalletTopUpStatus.PENDING, saved.getValue().getStatus());
        assertEquals(wallet, saved.getValue().getWallet());
        assertEquals(student, saved.getValue().getStudent());
        assertEquals("https://sandbox.vnpayment.vn/pay?x=1", response.paymentUrl());

        // Creating a request must never move money.
        verify(walletService, never()).credit(any(), any(), any(), anyString(), any(), anyString());
    }

    @Test
    void createTopUp_referenceCarriesTopUpPrefixSoCallbacksCanBeRouted() {
        stubCurrentStudent();
        when(walletService.getOrCreateStudentWallet(student)).thenReturn(wallet);
        when(paymentGateway.getProvider()).thenReturn("VNPAY");
        when(walletTopUpRepository.existsByTopUpCode(anyString())).thenReturn(false);
        when(walletTopUpRepository.save(any(WalletTopUp.class))).thenAnswer(inv -> inv.getArgument(0));
        when(paymentGateway.buildPaymentUrl(any(PaymentIntent.class), anyString())).thenReturn("url");

        WalletTopUpResponse response =
                service.createTopUp(new CreateTopUpRequest(new BigDecimal("50000")), "127.0.0.1");

        assertNotNull(response.topUpCode());
        org.junit.jupiter.api.Assertions.assertTrue(
                response.topUpCode().startsWith(WalletTopUpService.CODE_PREFIX));
    }

    @Test
    void createTopUp_rejectsAmountBelowMinimum() {
        assertThrows(BusinessException.class,
                () -> service.createTopUp(new CreateTopUpRequest(new BigDecimal("5000")), "127.0.0.1"));
        verifyNoInteractions(walletTopUpRepository);
    }

    @Test
    void createTopUp_rejectsAmountAboveMaximum() {
        assertThrows(BusinessException.class,
                () -> service.createTopUp(new CreateTopUpRequest(new BigDecimal("60000000")), "127.0.0.1"));
        verifyNoInteractions(walletTopUpRepository);
    }

    @Test
    void createTopUp_rejectsFractionalAmount() {
        assertThrows(BusinessException.class,
                () -> service.createTopUp(new CreateTopUpRequest(new BigDecimal("10000.50")), "127.0.0.1"));
        verifyNoInteractions(walletTopUpRepository);
    }

    // ── callback ────────────────────────────────────────────────────────────

    @Test
    void handleCallback_validSuccessfulCallback_creditsWalletAndNotifiesStudent() {
        when(paymentGateway.parseCallback(params)).thenReturn(result(true, true, 10_000_000L));
        when(walletTopUpRepository.findByTopUpCodeForUpdate(TOPUP_CODE)).thenReturn(Optional.of(topUp));
        WalletTransaction ledgerLine = WalletTransaction.builder().id(UUID.randomUUID()).build();
        when(walletService.credit(eq(wallet), eq(topUp.getAmount()),
                eq(WalletTransactionType.ADJUSTMENT), eq(WalletTopUpService.REFERENCE_TYPE),
                eq(topUp.getId()), anyString())).thenReturn(ledgerLine);

        IpnAckResponse ack = service.handleCallback(params);

        assertEquals("00", ack.rspCode());
        assertEquals(WalletTopUpStatus.SUCCESS, topUp.getStatus());
        assertEquals(ledgerLine, topUp.getWalletTransaction());
        verify(notificationService).createNotification(any(), anyString(), anyString(), anyString(), anyString());
    }

    @Test
    void handleCallback_invalidChecksum_neverTouchesTheWallet() {
        when(paymentGateway.parseCallback(params)).thenReturn(result(false, true, 10_000_000L));

        IpnAckResponse ack = service.handleCallback(params);

        assertEquals("97", ack.rspCode());
        verify(walletTopUpRepository, never()).findByTopUpCodeForUpdate(anyString());
        verify(walletService, never()).credit(any(), any(), any(), anyString(), any(), anyString());
    }

    @Test
    void handleCallback_unknownReference_isRejected() {
        when(paymentGateway.parseCallback(params)).thenReturn(result(true, true, 10_000_000L));
        when(walletTopUpRepository.findByTopUpCodeForUpdate(TOPUP_CODE)).thenReturn(Optional.empty());

        assertEquals("01", service.handleCallback(params).rspCode());
        verify(walletService, never()).credit(any(), any(), any(), anyString(), any(), anyString());
    }

    @Test
    void handleCallback_amountMismatch_isRejectedWithoutCrediting() {
        // Provider claims 999,999,900 minor units; we recorded 100,000 VND = 10,000,000.
        when(paymentGateway.parseCallback(params)).thenReturn(result(true, true, 999_999_900L));
        when(walletTopUpRepository.findByTopUpCodeForUpdate(TOPUP_CODE)).thenReturn(Optional.of(topUp));

        assertEquals("04", service.handleCallback(params).rspCode());
        assertEquals(WalletTopUpStatus.PENDING, topUp.getStatus());
        verify(walletService, never()).credit(any(), any(), any(), anyString(), any(), anyString());
    }

    @Test
    void handleCallback_replayedCallbackForCreditedTopUp_isANoOp() {
        topUp.setStatus(WalletTopUpStatus.SUCCESS);
        when(paymentGateway.parseCallback(params)).thenReturn(result(true, true, 10_000_000L));
        when(walletTopUpRepository.findByTopUpCodeForUpdate(TOPUP_CODE)).thenReturn(Optional.of(topUp));

        assertEquals("02", service.handleCallback(params).rspCode());
        verify(walletService, never()).credit(any(), any(), any(), anyString(), any(), anyString());
        verifyNoInteractions(notificationService);
    }

    @Test
    void handleCallback_failedPayment_marksFailedAndLeavesBalanceUntouched() {
        when(paymentGateway.parseCallback(params)).thenReturn(result(true, false, 10_000_000L));
        when(walletTopUpRepository.findByTopUpCodeForUpdate(TOPUP_CODE)).thenReturn(Optional.of(topUp));

        assertEquals("00", service.handleCallback(params).rspCode());
        assertEquals(WalletTopUpStatus.FAILED, topUp.getStatus());
        verify(walletService, never()).credit(any(), any(), any(), anyString(), any(), anyString());
        verifyNoInteractions(notificationService);
    }

    // ── ownership ───────────────────────────────────────────────────────────

    @Test
    void getTopUpForCurrentStudent_anotherStudentsTopUp_isNotFound() {
        stubCurrentStudent();
        StudentProfile other = StudentProfile.builder().id(UUID.randomUUID()).build();
        WalletTopUp foreign = WalletTopUp.builder()
                .id(UUID.randomUUID()).student(other).wallet(wallet)
                .topUpCode("TU999").amount(BigDecimal.TEN).currency("VND")
                .status(WalletTopUpStatus.SUCCESS).provider("VNPAY").build();
        when(walletTopUpRepository.findById(foreign.getId())).thenReturn(Optional.of(foreign));

        assertThrows(BusinessException.class,
                () -> service.getTopUpForCurrentStudent(foreign.getId()));
    }

    // ── helpers ─────────────────────────────────────────────────────────────

    private void stubCurrentStudent() {
        UUID userId = student.getUser() != null ? student.getUser().getId() : UUID.randomUUID();
        lenient().when(currentUserService.getCurrentUserId()).thenReturn(userId);
        lenient().when(studentProfileRepository.findByUser_Id(userId)).thenReturn(Optional.of(student));
    }

    private PaymentCallbackResult result(boolean validSignature, boolean success, long amountMinor) {
        return new PaymentCallbackResult(validSignature, TOPUP_CODE, "9876543210", amountMinor,
                success ? "00" : "24", success ? "00" : "02", success);
    }
}
