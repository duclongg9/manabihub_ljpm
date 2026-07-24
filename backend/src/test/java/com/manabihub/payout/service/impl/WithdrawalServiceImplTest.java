package com.manabihub.payout.service.impl;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.notification.service.NotificationService;
import com.manabihub.payout.dto.request.BankAccountDto;
import com.manabihub.payout.dto.request.CreateWithdrawalRequest;
import com.manabihub.payout.dto.response.WithdrawalRequestResponse;
import com.manabihub.payout.entity.BankAccountSnapshot;
import com.manabihub.payout.entity.WithdrawalRequest;
import com.manabihub.payout.enums.WithdrawalStatus;
import com.manabihub.payout.mapper.WithdrawalMapper;
import com.manabihub.payout.repository.WithdrawalRequestRepository;
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

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WithdrawalServiceImplTest {

    @Mock
    private WithdrawalRequestRepository withdrawalRepository;
    @Mock
    private TeacherWalletRepository teacherWalletRepository;
    @Mock
    private com.manabihub.payout.repository.TeacherBankAccountRepository bankAccountRepository;
    @Mock
    private com.manabihub.identity.repository.AppUserRepository appUserRepository;
    @Mock
    private com.manabihub.common.mail.EmailService emailService;
    @Mock
    private WalletService walletService;
    @Mock
    private WithdrawalMapper withdrawalMapper;
    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private WithdrawalServiceImpl withdrawalService;

    private final String teacherIdStr = "d290f1ee-6c54-4b01-90e6-d701748f0851";
    private final java.util.UUID teacherId = java.util.UUID.fromString(teacherIdStr);
    private final BigDecimal minimumPayout = new BigDecimal("500000");

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(withdrawalService, "minimumPayoutAmount", minimumPayout);
        
        com.manabihub.identity.entity.AppUser mockUser = new com.manabihub.identity.entity.AppUser();
        mockUser.setId(teacherId);
        mockUser.setEmail("teacher@example.com");
        org.mockito.Mockito.lenient().when(appUserRepository.findById(teacherId)).thenReturn(Optional.of(mockUser));
    }

    private String seedAndGetOtp() {
        withdrawalService.sendWithdrawalOtp(teacherIdStr);
        java.util.concurrent.ConcurrentHashMap<String, Object> cache = 
            (java.util.concurrent.ConcurrentHashMap<String, Object>) ReflectionTestUtils.getField(withdrawalService, "otpCache");
        Object entry = cache.get(teacherIdStr);
        return (String) ReflectionTestUtils.getField(entry, "code");
    }

    @Test
    void testCreateWithdrawalRequest_Success() {
        String code = seedAndGetOtp();
        
        CreateWithdrawalRequest request = new CreateWithdrawalRequest();
        request.setAmount(new BigDecimal("1000000"));
        request.setOtpCode(code);
        
        BankAccountDto bankAccountDto = new BankAccountDto();
        bankAccountDto.setBankCode("VCB");
        bankAccountDto.setBankName("Vietcombank");
        bankAccountDto.setAccountHolderName("NGUYEN VAN A");
        bankAccountDto.setAccountNumber("123456789");
        request.setBankAccount(bankAccountDto);

        java.util.UUID walletId = java.util.UUID.randomUUID();
        TeacherWallet wallet = TeacherWallet.builder()
                .id(walletId)
                .teacherId(teacherId)
                .balance(new BigDecimal("2000000"))
                .frozenBalance(BigDecimal.ZERO)
                .build();

        java.util.UUID withdrawalId = java.util.UUID.randomUUID();
        WithdrawalRequest savedRequest = WithdrawalRequest.builder()
                .id(withdrawalId)
                .status(WithdrawalStatus.PENDING)
                .build();

        WithdrawalRequestResponse responseDto = new WithdrawalRequestResponse();
        responseDto.setId(withdrawalId.toString());
        responseDto.setStatus(WithdrawalStatus.PENDING);

        when(withdrawalRepository.countByTeacherIdAndStatus(teacherId, WithdrawalStatus.PENDING)).thenReturn(0L);
        when(withdrawalRepository.countByTeacherIdAndCreatedAtAfter(eq(teacherId), any(LocalDateTime.class))).thenReturn(0L);
        when(teacherWalletRepository.findByTeacherId(teacherId)).thenReturn(Optional.of(wallet));
        when(withdrawalRepository.save(any(WithdrawalRequest.class))).thenReturn(savedRequest);
        when(withdrawalMapper.toResponse(any(WithdrawalRequest.class))).thenReturn(responseDto);

        WithdrawalRequestResponse result = withdrawalService.createWithdrawalRequest(teacherIdStr, request);

        assertNotNull(result);
        assertEquals(WithdrawalStatus.PENDING, result.getStatus());
        verify(walletService, times(1)).reserveBalance(eq(teacherIdStr), eq(request.getAmount()), eq(withdrawalId.toString()));
        verify(notificationService, times(1)).createNotificationForRole(anyString(), anyString(), anyString(), anyString(), anyString());
    }

    @Test
    void testCreateWithdrawalRequest_AmountBelowMinimum() {
        CreateWithdrawalRequest request = new CreateWithdrawalRequest();
        request.setAmount(new BigDecimal("100000")); // Below 500k

        BusinessException exception = assertThrows(BusinessException.class, 
            () -> withdrawalService.createWithdrawalRequest(teacherIdStr, request));
            
        assertEquals(MessageCodes.PAYOUT_AMOUNT_BELOW_MINIMUM, exception.getMessageCode());
        verify(walletService, never()).reserveBalance(any(), any(), any());
        verify(withdrawalRepository, never()).save(any());
    }

    @Test
    void testCreateWithdrawalRequest_WalletNotFound() {
        String code = seedAndGetOtp();
        
        CreateWithdrawalRequest request = new CreateWithdrawalRequest();
        request.setAmount(new BigDecimal("1000000"));
        request.setOtpCode(code);
        
        BankAccountDto bankAccountDto = new BankAccountDto();
        bankAccountDto.setBankCode("VCB");
        bankAccountDto.setBankName("VCB");
        bankAccountDto.setAccountHolderName("TEST");
        bankAccountDto.setAccountNumber("12345");
        request.setBankAccount(bankAccountDto);

        when(withdrawalRepository.countByTeacherIdAndStatus(teacherId, WithdrawalStatus.PENDING)).thenReturn(0L);
        when(withdrawalRepository.countByTeacherIdAndCreatedAtAfter(eq(teacherId), any(LocalDateTime.class))).thenReturn(0L);
        when(teacherWalletRepository.findByTeacherId(teacherId)).thenReturn(Optional.empty());

        BusinessException exception = assertThrows(BusinessException.class, 
            () -> withdrawalService.createWithdrawalRequest(teacherIdStr, request));
            
        assertEquals(MessageCodes.WALLET_NOT_FOUND, exception.getMessageCode());
        verify(walletService, never()).reserveBalance(any(), any(), any());
    }
}
