package com.manabihub.payout.service.impl;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.notification.service.NotificationService;
import com.manabihub.payout.dto.request.ManualTransferRequest;
import com.manabihub.payout.dto.request.RejectPayoutRequest;
import com.manabihub.payout.dto.response.PayoutDetailResponse;
import com.manabihub.payout.dto.response.PayoutQueueItemResponse;
import com.manabihub.payout.entity.PayoutSettlement;
import com.manabihub.payout.entity.WithdrawalRequest;
import com.manabihub.payout.enums.PayoutStatus;
import com.manabihub.payout.enums.ReconciliationStatus;
import com.manabihub.payout.enums.WithdrawalStatus;
import com.manabihub.payout.repository.PayoutSettlementRepository;
import com.manabihub.payout.repository.WithdrawalRequestRepository;
import com.manabihub.payout.service.PayoutGateway;
import com.manabihub.payout.service.PayoutSettlementService;
import com.manabihub.wallet.entity.TeacherWallet;
import com.manabihub.wallet.entity.WalletLedger;
import com.manabihub.wallet.enums.WalletLedgerType;
import com.manabihub.wallet.repository.TeacherWalletRepository;
import com.manabihub.wallet.repository.WalletLedgerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PayoutSettlementServiceImpl implements PayoutSettlementService {

    private final WithdrawalRequestRepository withdrawalRequestRepository;
    private final PayoutSettlementRepository payoutSettlementRepository;
    private final TeacherWalletRepository teacherWalletRepository;
    private final WalletLedgerRepository walletLedgerRepository;
    private final NotificationService notificationService;
    private final PayoutGateway payoutGateway;
    private final TransactionTemplate transactionTemplate;

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('FINANCE_MANAGER')")
    public Page<PayoutQueueItemResponse> getPayoutQueue(Pageable pageable) {
        return withdrawalRequestRepository.findAll(pageable)
                .map(wr -> {
                    PayoutQueueItemResponse res = new PayoutQueueItemResponse();
                    res.setWithdrawalRequestId(wr.getId());
                    res.setTeacherId(wr.getTeacherId());
                    res.setTeacherName("Teacher " + wr.getTeacherId().toString().substring(0, 8)); // Mocked name
                    res.setRequestedAmount(wr.getAmount());
                    res.setStatus(wr.getStatus());
                    res.setReconciliationStatus(ReconciliationStatus.MATCHED); // Simulated
                    res.setRequestedAt(wr.getCreatedAt());
                    return res;
                });
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('FINANCE_MANAGER')")
    public PayoutDetailResponse getPayoutDetail(UUID withdrawalRequestId) {
        WithdrawalRequest request = withdrawalRequestRepository.findById(withdrawalRequestId)
                .orElseThrow(() -> new BusinessException(MessageCodes.PAYOUT_NOT_FOUND, "Withdrawal request not found"));
        
        TeacherWallet wallet = teacherWalletRepository.findByTeacherId(request.getTeacherId())
                .orElseThrow(() -> new BusinessException(MessageCodes.WALLET_NOT_FOUND, "Teacher wallet not found"));

        Optional<PayoutSettlement> settlementOpt = payoutSettlementRepository.findByWithdrawalRequestId(withdrawalRequestId);

        PayoutDetailResponse res = new PayoutDetailResponse();
        res.setWithdrawalRequestId(request.getId());
        res.setTeacherId(request.getTeacherId());
        res.setTeacherName("Teacher " + request.getTeacherId().toString().substring(0, 8));
        res.setRequestedAmount(request.getAmount());
        res.setAvailableBalance(wallet.getAvailableBalance());
        res.setReservedBalance(wallet.getReservedBalance());
        res.setWalletFrozen(wallet.isFrozen());
        res.setStatus(request.getStatus());
        
        res.setReconciliationStatus(ReconciliationStatus.MATCHED);
        res.setReconciliationAlerts(new ArrayList<>());

        res.setBankName(request.getBankName());
        res.setBankBranch(request.getBankBranch());
        res.setAccountHolderName(request.getAccountHolderName());
        // Mask account number: keep last 4 digits
        String acct = request.getAccountNumber();
        res.setAccountNumberMasked(acct.length() > 4 ? "****" + acct.substring(acct.length() - 4) : "****");

        res.setRequestedAt(request.getCreatedAt());

        settlementOpt.ifPresent(settlement -> {
            res.setSettlementId(settlement.getId());
            res.setSettlementStatus(settlement.getStatus());
            res.setSettledAt(settlement.getSettledAt());
            res.setDecisionReason(settlement.getDecisionReason());
            res.setGatewayReference(settlement.getGatewayTransactionReference());
        });

        return res;
    }

    @Override
    @PreAuthorize("hasRole('FINANCE_MANAGER')")
    public void approvePayout(UUID withdrawalRequestId) {
        // Stage 1: Prepare
        PayoutSettlement settlement = transactionTemplate.execute(status -> preparePayout(withdrawalRequestId));
        
        if (settlement == null) {
            return; // Means it's already processed or blocked
        }

        // Stage 2: External Call
        WithdrawalRequest request = withdrawalRequestRepository.findById(withdrawalRequestId).orElseThrow();
        PayoutGateway.PayoutGatewayCommand command = PayoutGateway.PayoutGatewayCommand.builder()
                .settlementId(settlement.getId())
                .amount(settlement.getAmount())
                .currency(settlement.getCurrency())
                .bankName(request.getBankName())
                .bankBranch(request.getBankBranch())
                .accountHolderName(request.getAccountHolderName())
                .accountNumber(request.getAccountNumber())
                .idempotencyKey(settlement.getIdempotencyKey())
                .build();
                
        PayoutGateway.PayoutGatewayResult result = payoutGateway.transfer(command);

        // Stage 3: Finalize
        transactionTemplate.executeWithoutResult(status -> finalizePayout(settlement.getId(), result));
    }

    private PayoutSettlement preparePayout(UUID withdrawalRequestId) {
        WithdrawalRequest request = withdrawalRequestRepository.findByIdWithLock(withdrawalRequestId)
                .orElseThrow(() -> new BusinessException(MessageCodes.PAYOUT_NOT_FOUND, "Withdrawal request not found"));

        if (request.getStatus() == WithdrawalStatus.PAID || request.getStatus() == WithdrawalStatus.REJECTED) {
            throw new BusinessException(MessageCodes.PAYOUT_INVALID_STATUS, "Request is already processed");
        }
        
        TeacherWallet wallet = teacherWalletRepository.findByIdWithLock(request.getWalletId())
                .orElseThrow(() -> new BusinessException(MessageCodes.WALLET_NOT_FOUND, "Teacher wallet not found"));

        if (wallet.isFrozen()) {
            throw new BusinessException(MessageCodes.PAYOUT_BALANCE_FROZEN, "Teacher wallet is frozen");
        }
        
        if (wallet.getReservedBalance().compareTo(request.getAmount()) < 0) {
            throw new BusinessException(MessageCodes.PAYOUT_RECONCILIATION_MISMATCH, "Critical mismatch: Insufficient reserved balance");
        }

        Optional<PayoutSettlement> existingOpt = payoutSettlementRepository.findByWithdrawalRequestId(withdrawalRequestId);
        PayoutSettlement settlement;
        
        if (existingOpt.isPresent()) {
            settlement = existingOpt.get();
            if (settlement.getStatus() == PayoutStatus.SUCCEEDED) {
                throw new BusinessException(MessageCodes.PAYOUT_DUPLICATE_SETTLEMENT, "Settlement already succeeded");
            }
            if (settlement.getStatus() == PayoutStatus.PROCESSING) {
                throw new BusinessException(MessageCodes.PAYOUT_SETTLEMENT_PROCESSING, "Settlement is currently processing");
            }
            settlement.setStatus(PayoutStatus.PROCESSING);
            settlement.setRetryCount(settlement.getRetryCount() + 1);
        } else {
            settlement = new PayoutSettlement();
            settlement.setWithdrawalRequestId(request.getId());
            settlement.setTeacherId(request.getTeacherId());
            settlement.setWalletId(wallet.getId());
            settlement.setAmount(request.getAmount());
            settlement.setCurrency("VND");
            settlement.setStatus(PayoutStatus.PROCESSING);
            settlement.setIdempotencyKey(UUID.randomUUID().toString());
            settlement.setReconciliationStatus(ReconciliationStatus.MATCHED);
            settlement.setProcessingStartedAt(Instant.now());
        }
        
        request.setStatus(WithdrawalStatus.PROCESSING);
        withdrawalRequestRepository.save(request);
        return payoutSettlementRepository.save(settlement);
    }

    private void finalizePayout(UUID settlementId, PayoutGateway.PayoutGatewayResult result) {
        PayoutSettlement settlement = payoutSettlementRepository.findByIdWithLock(settlementId)
                .orElseThrow(() -> new BusinessException(MessageCodes.COMMON_NOT_FOUND, "Settlement not found"));
                
        WithdrawalRequest request = withdrawalRequestRepository.findByIdWithLock(settlement.getWithdrawalRequestId())
                .orElseThrow(() -> new BusinessException(MessageCodes.PAYOUT_NOT_FOUND, "Request not found"));
                
        TeacherWallet wallet = teacherWalletRepository.findByIdWithLock(settlement.getWalletId())
                .orElseThrow(() -> new BusinessException(MessageCodes.WALLET_NOT_FOUND, "Wallet not found"));

        if (result.isSuccess()) {
            settlement.setStatus(PayoutStatus.SUCCEEDED);
            settlement.setGatewayTransactionReference(result.getProviderReference());
            settlement.setSettledAt(Instant.now());
            settlement.setDecision("APPROVED");
            
            request.setStatus(WithdrawalStatus.PAID);
            
            // Consume reserved balance
            wallet.setReservedBalance(wallet.getReservedBalance().subtract(request.getAmount()));
            
            WalletLedger ledger = new WalletLedger();
            ledger.setWalletId(wallet.getId());
            ledger.setTransactionType(WalletLedgerType.PAYOUT_SETTLEMENT.name());
            ledger.setAmount(request.getAmount().negate());
            ledger.setBalanceAfter(wallet.getAvailableBalance()); // Total available doesn't change here since it was deducted when reserved
            ledger.setReferenceId(settlement.getId().toString());
            ledger.setReferenceType("PAYOUT_SETTLEMENT");
            ledger.setDescription("Payout settlement succeeded");
            
            walletLedgerRepository.save(ledger);
            
            // Send notification
            notificationService.createNotification(
                    request.getTeacherId(),
                    null,
                    "Withdrawal Successful",
                    "Your withdrawal of " + request.getAmount() + " VND has been transferred to your bank account.",
                    "PAYOUT_SUCCESS"
            );
        } else {
            settlement.setStatus(result.isRetryable() ? PayoutStatus.PENDING_RETRY : PayoutStatus.FAILED);
            settlement.setFailureCode(result.getErrorCode());
            settlement.setFailureMessageSanitized(result.getErrorMessage());
            
            request.setStatus(result.isRetryable() ? WithdrawalStatus.PENDING_RETRY : WithdrawalStatus.FAILED);
            
            if (!result.isRetryable()) {
                notificationService.createNotification(
                    request.getTeacherId(),
                    null,
                    "Withdrawal Failed",
                    "Your withdrawal request failed: " + result.getErrorMessage(),
                    "PAYOUT_FAILED"
                );
            }
        }
        
        teacherWalletRepository.save(wallet);
        withdrawalRequestRepository.save(request);
        payoutSettlementRepository.save(settlement);
    }

    @Override
    @Transactional
    @PreAuthorize("hasRole('FINANCE_MANAGER')")
    public void rejectPayout(UUID withdrawalRequestId, RejectPayoutRequest requestPayload) {
        WithdrawalRequest request = withdrawalRequestRepository.findByIdWithLock(withdrawalRequestId)
                .orElseThrow(() -> new BusinessException(MessageCodes.PAYOUT_NOT_FOUND, "Request not found"));
                
        if (request.getStatus() == WithdrawalStatus.PAID || request.getStatus() == WithdrawalStatus.REJECTED) {
            throw new BusinessException(MessageCodes.PAYOUT_INVALID_STATUS, "Request is already processed");
        }
        
        TeacherWallet wallet = teacherWalletRepository.findByIdWithLock(request.getWalletId())
                .orElseThrow(() -> new BusinessException(MessageCodes.WALLET_NOT_FOUND, "Wallet not found"));
                
        // Release reservation back to available
        wallet.setReservedBalance(wallet.getReservedBalance().subtract(request.getAmount()));
        wallet.setAvailableBalance(wallet.getAvailableBalance().add(request.getAmount()));
        
        WalletLedger ledger = new WalletLedger();
        ledger.setWalletId(wallet.getId());
        ledger.setTransactionType(WalletLedgerType.WITHDRAWAL_RESERVATION_RELEASED.name());
        ledger.setAmount(request.getAmount());
        ledger.setBalanceAfter(wallet.getAvailableBalance());
        ledger.setReferenceId(request.getId().toString());
        ledger.setReferenceType("WITHDRAWAL_REQUEST");
        ledger.setDescription("Withdrawal rejected: " + requestPayload.getReason());
        
        walletLedgerRepository.save(ledger);
        teacherWalletRepository.save(wallet);
        
        request.setStatus(WithdrawalStatus.REJECTED);
        withdrawalRequestRepository.save(request);
        
        PayoutSettlement settlement = payoutSettlementRepository.findByWithdrawalRequestId(request.getId())
                .orElseGet(() -> {
                    PayoutSettlement ps = new PayoutSettlement();
                    ps.setWithdrawalRequestId(request.getId());
                    ps.setTeacherId(request.getTeacherId());
                    ps.setWalletId(wallet.getId());
                    ps.setAmount(request.getAmount());
                    ps.setIdempotencyKey(UUID.randomUUID().toString());
                    ps.setReconciliationStatus(ReconciliationStatus.MATCHED);
                    return ps;
                });
                
        settlement.setStatus(PayoutStatus.REJECTED);
        settlement.setDecision("REJECTED");
        settlement.setDecisionReason(requestPayload.getReason());
        settlement.setDecidedAt(Instant.now());
        payoutSettlementRepository.save(settlement);
        
        notificationService.createNotification(
                request.getTeacherId(),
                null,
                "Withdrawal Rejected",
                "Your withdrawal request was rejected. Reason: " + requestPayload.getReason(),
                "PAYOUT_REJECTED"
        );
    }

    @Override
    @Transactional
    @PreAuthorize("hasRole('FINANCE_MANAGER')")
    public void confirmManualTransfer(UUID withdrawalRequestId, ManualTransferRequest requestPayload) {
        WithdrawalRequest request = withdrawalRequestRepository.findByIdWithLock(withdrawalRequestId)
                .orElseThrow(() -> new BusinessException(MessageCodes.PAYOUT_NOT_FOUND, "Request not found"));
                
        if (request.getStatus() == WithdrawalStatus.PAID || request.getStatus() == WithdrawalStatus.REJECTED) {
            throw new BusinessException(MessageCodes.PAYOUT_INVALID_STATUS, "Request is already processed");
        }
        
        if (request.getAmount().compareTo(requestPayload.getTransferredAmount()) != 0) {
            throw new BusinessException(MessageCodes.PAYOUT_RECONCILIATION_MISMATCH, "Transferred amount does not match requested amount");
        }
        
        TeacherWallet wallet = teacherWalletRepository.findByIdWithLock(request.getWalletId())
                .orElseThrow(() -> new BusinessException(MessageCodes.WALLET_NOT_FOUND, "Wallet not found"));
                
        wallet.setReservedBalance(wallet.getReservedBalance().subtract(request.getAmount()));
        
        WalletLedger ledger = new WalletLedger();
        ledger.setWalletId(wallet.getId());
        ledger.setTransactionType(WalletLedgerType.PAYOUT_SETTLEMENT.name());
        ledger.setAmount(request.getAmount().negate());
        ledger.setBalanceAfter(wallet.getAvailableBalance());
        ledger.setReferenceId(request.getId().toString());
        ledger.setReferenceType("MANUAL_TRANSFER");
        ledger.setDescription("Manual transfer confirmed. Ref: " + requestPayload.getTransactionReference());
        
        walletLedgerRepository.save(ledger);
        teacherWalletRepository.save(wallet);
        
        request.setStatus(WithdrawalStatus.PAID);
        withdrawalRequestRepository.save(request);
        
        PayoutSettlement settlement = payoutSettlementRepository.findByWithdrawalRequestId(request.getId())
                .orElseGet(() -> {
                    PayoutSettlement ps = new PayoutSettlement();
                    ps.setWithdrawalRequestId(request.getId());
                    ps.setTeacherId(request.getTeacherId());
                    ps.setWalletId(wallet.getId());
                    ps.setAmount(request.getAmount());
                    ps.setIdempotencyKey(UUID.randomUUID().toString());
                    ps.setReconciliationStatus(ReconciliationStatus.MATCHED);
                    return ps;
                });
                
        settlement.setStatus(PayoutStatus.SUCCEEDED);
        settlement.setManualBankTransactionReference(requestPayload.getTransactionReference());
        settlement.setProofFileId(requestPayload.getProofFileId());
        settlement.setDecision("MANUAL_APPROVED");
        settlement.setDecisionReason(requestPayload.getNote());
        settlement.setSettledAt(requestPayload.getTransferredAt());
        payoutSettlementRepository.save(settlement);
        
        notificationService.createNotification(
                request.getTeacherId(),
                null,
                "Withdrawal Successful (Manual Transfer)",
                "Your withdrawal of " + request.getAmount() + " VND has been transferred. Reference: " + requestPayload.getTransactionReference(),
                "PAYOUT_SUCCESS"
        );
    }
}
