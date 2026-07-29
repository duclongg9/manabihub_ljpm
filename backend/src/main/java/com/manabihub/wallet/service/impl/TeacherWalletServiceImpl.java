package com.manabihub.wallet.service.impl;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.identity.service.CurrentUserService;
import com.manabihub.kyc.domain.TeacherProfile;
import com.manabihub.kyc.repository.TeacherProfileRepository;
import com.manabihub.wallet.dto.response.EscrowEntryResponse;
import com.manabihub.wallet.dto.response.TeacherWalletSummaryResponse;
import com.manabihub.wallet.dto.response.WalletActivityResponse;
import com.manabihub.wallet.entity.Wallet;
import com.manabihub.wallet.entity.WalletTransaction;
import com.manabihub.wallet.enums.PayoutStatus;
import com.manabihub.wallet.enums.WalletTransactionSection;
import com.manabihub.wallet.mapper.EscrowLedgerMapper;
import com.manabihub.wallet.mapper.WalletTransactionMapper;
import com.manabihub.wallet.repository.WalletTransactionRepository;
import com.manabihub.wallet.service.EscrowService;
import com.manabihub.wallet.service.TeacherWalletService;
import com.manabihub.wallet.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TeacherWalletServiceImpl implements TeacherWalletService {

    private final WalletService walletService;
    private final EscrowService escrowService;
    private final WalletTransactionRepository walletTransactionRepository;
    private final TeacherProfileRepository teacherProfileRepository;
    private final CurrentUserService currentUserService;
    private final WalletTransactionMapper walletTransactionMapper;
    private final EscrowLedgerMapper escrowLedgerMapper;

    @Override
    public TeacherWalletSummaryResponse getWalletSummary() {
        TeacherProfile teacher = resolveTeacher();
        Wallet wallet = walletService.getOrCreateTeacherWallet(teacher);

        BigDecimal totalWithdrawn = walletTransactionRepository.findByWallet_IdOrderByCreatedAtDesc(wallet.getId())
                .stream()
                .filter(tx -> walletTransactionMapper.classify(tx) == WalletTransactionSection.WITHDRAWAL)
                .map(WalletTransaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new TeacherWalletSummaryResponse(
                wallet.getId(),
                wallet.getCurrency(),
                wallet.getBalance(),
                wallet.getFrozenBalance(),
                totalWithdrawn,
                derivePayoutStatus(wallet),
                wallet.getUpdatedAt());
    }

    @Override
    public List<EscrowEntryResponse> getPendingEscrow() {
        TeacherProfile teacher = resolveTeacher();
        return escrowService.findPendingEscrowForTeacher(teacher).stream()
                .map(escrowLedgerMapper::toResponse)
                .toList();
    }

    @Override
    public List<WalletActivityResponse> getWithdrawalHistory() {
        TeacherProfile teacher = resolveTeacher();
        Wallet wallet = walletService.getOrCreateTeacherWallet(teacher);

        return walletTransactionRepository.findByWallet_IdOrderByCreatedAtDesc(wallet.getId()).stream()
                .filter(tx -> walletTransactionMapper.classify(tx) == WalletTransactionSection.WITHDRAWAL)
                .map(walletTransactionMapper::toActivityResponse)
                .toList();
    }

    /**
     * Derived pending-payout state: there is no dedicated payout-request entity yet
     * (teacher payout settlement is MHB-40), so this is inferred from the wallet's
     * balance/frozen balance.
     */
    private PayoutStatus derivePayoutStatus(Wallet wallet) {
        if (wallet.getFrozenBalance().compareTo(BigDecimal.ZERO) > 0) {
            return PayoutStatus.ESCROW_PENDING;
        }
        if (wallet.getBalance().compareTo(BigDecimal.ZERO) > 0) {
            return PayoutStatus.AVAILABLE_FOR_PAYOUT;
        }
        return PayoutStatus.NO_ACTIVITY;
    }

    private TeacherProfile resolveTeacher() {
        UUID userId = currentUserService.getCurrentUserId();
        return teacherProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.AUTH_FORBIDDEN,
                        "Teacher profile is required.",
                        HttpStatus.FORBIDDEN
                ));
    }
}
