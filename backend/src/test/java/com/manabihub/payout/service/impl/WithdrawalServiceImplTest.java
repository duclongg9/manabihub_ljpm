package com.manabihub.payout.service.impl;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.kyc.domain.TeacherProfile;
import com.manabihub.kyc.repository.TeacherProfileRepository;
import com.manabihub.payout.dto.request.BankAccountDto;
import com.manabihub.payout.dto.request.CreateWithdrawalRequest;
import com.manabihub.payout.dto.response.WithdrawalRequestResponse;
import com.manabihub.payout.entity.TeacherBankAccount;
import com.manabihub.payout.entity.WithdrawalRequest;
import com.manabihub.payout.enums.WithdrawalStatus;
import com.manabihub.payout.mapper.WithdrawalMapper;
import com.manabihub.payout.repository.TeacherBankAccountRepository;
import com.manabihub.payout.repository.WithdrawalRequestRepository;
import com.manabihub.payout.security.PayoutSecurityService;
import com.manabihub.payout.service.WithdrawalOtpService;
import com.manabihub.payout.service.WithdrawalNotificationService;
import com.manabihub.wallet.entity.TeacherWallet;
import com.manabihub.wallet.repository.TeacherWalletRepository;
import com.manabihub.wallet.service.WalletService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import com.manabihub.systemconfig.service.SystemSettingValueService;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WithdrawalServiceImplTest {

    @Mock private WithdrawalRequestRepository withdrawalRepository;
    @Mock private TeacherWalletRepository teacherWalletRepository;
    @Mock private TeacherBankAccountRepository bankAccountRepository;
    @Mock private TeacherProfileRepository teacherProfileRepository;
    @Mock private WalletService walletService;
    @Mock private WithdrawalMapper withdrawalMapper;
    @Mock private WithdrawalNotificationService notificationService;
    @Mock private WithdrawalOtpService otpService;
    @Mock private PayoutSecurityService securityService;
    @Mock private SystemSettingValueService settingValueService;

    @InjectMocks
    private WithdrawalServiceImpl withdrawalService;

    private final String userIdString = "d290f1ee-6c54-4b01-90e6-d701748f0851";
    private final UUID userId = UUID.fromString(userIdString);
    private final UUID teacherProfileId =
            UUID.fromString("b82e8ebf-9997-45a6-bdbe-3fbe6ad25b04");
    private final BigDecimal minimumPayout = new BigDecimal("500000");
    private TeacherWallet wallet;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(
                withdrawalService,
                "minimumPayoutAmount",
                minimumPayout
        );
        org.mockito.Mockito.lenient()
                .when(settingValueService.getDecimal(any(String.class), any(BigDecimal.class)))
                .thenAnswer(invocation -> invocation.getArgument(1));

        TeacherProfile teacherProfile = new TeacherProfile();
        teacherProfile.setId(teacherProfileId);
        org.mockito.Mockito.lenient().when(teacherProfileRepository.findByUserId(userId))
                .thenReturn(Optional.of(teacherProfile));

        wallet = TeacherWallet.builder()
                .id(UUID.randomUUID())
                .teacherId(teacherProfileId)
                .balance(new BigDecimal("2000000"))
                .frozenBalance(BigDecimal.ZERO)
                .build();
    }

    @Test
    void createWithdrawalRequest_SerializesAndSecuresFinancialRequest() {
        CreateWithdrawalRequest request = newRequest();
        UUID withdrawalId = UUID.randomUUID();
        WithdrawalRequestResponse response = WithdrawalRequestResponse.builder()
                .id(withdrawalId.toString())
                .status(WithdrawalStatus.PENDING)
                .build();

        when(teacherWalletRepository.findByTeacherIdForUpdate(teacherProfileId))
                .thenReturn(Optional.of(wallet));
        when(withdrawalRepository.countByTeacherIdAndStatus(
                teacherProfileId,
                WithdrawalStatus.PENDING
        )).thenReturn(0L);
        when(withdrawalRepository.countByTeacherIdAndCreatedAtAfter(
                eq(teacherProfileId),
                any(LocalDateTime.class)
        )).thenReturn(0L);
        when(securityService.encryptAccountNumber("123456789"))
                .thenReturn("enc:v1:encrypted-account");
        when(withdrawalRepository.saveAndFlush(any(WithdrawalRequest.class)))
                .thenAnswer(invocation -> {
                    WithdrawalRequest saved = invocation.getArgument(0);
                    saved.setId(withdrawalId);
                    return saved;
                });
        when(withdrawalMapper.toResponse(any(WithdrawalRequest.class)))
                .thenReturn(response);

        WithdrawalRequestResponse result =
                withdrawalService.createWithdrawalRequest(userIdString, request);

        assertNotNull(result);
        assertEquals(WithdrawalStatus.PENDING, result.getStatus());
        verify(teacherWalletRepository).findByTeacherIdForUpdate(teacherProfileId);
        verify(otpService).consumeOtp(userIdString, "123456");
        verify(walletService).reserveBalance(
                teacherProfileId.toString(),
                request.getAmount(),
                withdrawalId.toString()
        );
        verify(notificationService).notifyFinanceManager(
                withdrawalId,
                request.getAmount()
        );
    }

    @Test
    void createWithdrawalRequest_WithSavedAccount_UsesOwnedEncryptedAccount() {
        UUID accountId = UUID.randomUUID();
        TeacherBankAccount account = TeacherBankAccount.builder()
                .id(accountId)
                .teacherId(teacherProfileId)
                .bankCode("VCB")
                .bankName("Vietcombank")
                .accountNumber("enc:v1:saved")
                .accountHolderName("NGUYEN VAN A")
                .build();
        CreateWithdrawalRequest request = newRequest();
        request.setBankAccount(null);
        request.setBankAccountId(accountId.toString());
        request.setSaveAccount(false);
        UUID withdrawalId = UUID.randomUUID();

        when(teacherWalletRepository.findByTeacherIdForUpdate(teacherProfileId))
                .thenReturn(Optional.of(wallet));
        when(withdrawalRepository.countByTeacherIdAndStatus(
                teacherProfileId,
                WithdrawalStatus.PENDING
        )).thenReturn(0L);
        when(withdrawalRepository.countByTeacherIdAndCreatedAtAfter(
                eq(teacherProfileId),
                any(LocalDateTime.class)
        )).thenReturn(0L);
        when(bankAccountRepository.findByIdAndTeacherId(accountId, teacherProfileId))
                .thenReturn(Optional.of(account));
        when(withdrawalRepository.saveAndFlush(any(WithdrawalRequest.class)))
                .thenAnswer(invocation -> {
                    WithdrawalRequest saved = invocation.getArgument(0);
                    saved.setId(withdrawalId);
                    assertEquals(
                            "enc:v1:saved",
                            saved.getBankAccountSnapshot().getAccountNumber()
                    );
                    return saved;
                });
        when(withdrawalMapper.toResponse(any())).thenReturn(new WithdrawalRequestResponse());

        withdrawalService.createWithdrawalRequest(userIdString, request);

        verify(securityService, never()).decryptAccountNumber(any());
        verify(bankAccountRepository, never()).save(any());
    }

    @Test
    void createWithdrawalRequest_AmountBelowMinimum_DoesNotConsumeOtp() {
        CreateWithdrawalRequest request = newRequest();
        request.setAmount(new BigDecimal("100000"));

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> withdrawalService.createWithdrawalRequest(userIdString, request)
        );

        assertEquals(MessageCodes.PAYOUT_AMOUNT_BELOW_MINIMUM, exception.getMessageCode());
        verifyNoInteractions(otpService, walletService);
        verify(withdrawalRepository, never()).saveAndFlush(any());
    }

    @Test
    void createWithdrawalRequest_WalletNotFound_DoesNotConsumeOtp() {
        CreateWithdrawalRequest request = newRequest();
        when(teacherWalletRepository.findByTeacherIdForUpdate(teacherProfileId))
                .thenReturn(Optional.empty());

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> withdrawalService.createWithdrawalRequest(userIdString, request)
        );

        assertEquals(MessageCodes.WALLET_NOT_FOUND, exception.getMessageCode());
        verifyNoInteractions(otpService, walletService);
    }

    @Test
    void cancelWithdrawal_LocksRequestAndNotifiesOnlyRequestingTeacher() {
        UUID withdrawalId = UUID.randomUUID();
        WithdrawalRequest request = WithdrawalRequest.builder()
                .id(withdrawalId)
                .teacherId(teacherProfileId)
                .requestedAmount(new BigDecimal("1000000"))
                .status(WithdrawalStatus.PENDING)
                .build();
        when(withdrawalRepository.findByIdAndTeacherIdWithLock(
                withdrawalId,
                teacherProfileId
        )).thenReturn(Optional.of(request));

        withdrawalService.cancelWithdrawal(userIdString, withdrawalId.toString());

        assertEquals(WithdrawalStatus.CANCELLED, request.getStatus());
        verify(walletService).releaseBalance(
                teacherProfileId.toString(),
                request.getRequestedAmount(),
                withdrawalId.toString()
        );
        verify(notificationService).notifyTeacherCancellation(
                userId,
                request.getRequestedAmount()
        );
    }

    private CreateWithdrawalRequest newRequest() {
        return CreateWithdrawalRequest.builder()
                .amount(new BigDecimal("1000000"))
                .otpCode("123456")
                .bankAccount(BankAccountDto.builder()
                        .bankCode("VCB")
                        .bankName("Vietcombank")
                        .accountHolderName("NGUYEN VAN A")
                        .accountNumber("123456789")
                        .build())
                .build();
    }
}
