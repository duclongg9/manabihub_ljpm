package com.manabihub.payout.service.impl;

import com.manabihub.kyc.domain.TeacherProfile;
import com.manabihub.kyc.domain.UserStatus;
import com.manabihub.payout.entity.BankAccountSnapshot;
import com.manabihub.payout.entity.WithdrawalRequest;
import com.manabihub.payout.enums.ReconciliationStatus;
import com.manabihub.payout.service.PayoutReconciliationService;
import com.manabihub.wallet.entity.TeacherWallet;
import com.manabihub.wallet.entity.WalletTransaction;
import com.manabihub.wallet.enums.EscrowStatus;
import com.manabihub.wallet.enums.WalletDirection;
import com.manabihub.wallet.enums.WalletTransactionType;
import com.manabihub.wallet.repository.EscrowLedgerRepository;
import com.manabihub.wallet.repository.WalletTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PayoutReconciliationServiceImpl implements PayoutReconciliationService {

    private static final String WITHDRAWAL_REFERENCE = "WITHDRAWAL_REQUEST";

    private final WalletTransactionRepository walletTransactionRepository;
    private final EscrowLedgerRepository escrowLedgerRepository;

    @Override
    public ReconciliationResult reconcile(
            WithdrawalRequest request,
            TeacherWallet wallet,
            TeacherProfile teacher
    ) {
        List<ReconciliationAlert> critical = new ArrayList<>();
        List<ReconciliationAlert> warnings = new ArrayList<>();

        boolean accountBlocked = teacher.getUser() == null
                || teacher.getUser().getUserStatus() != UserStatus.ACTIVE;
        if (accountBlocked) {
            critical.add(alert(
                    "PAYOUT_TEACHER_ACCOUNT_BLOCKED",
                    "CRITICAL",
                    "Teacher account is not active."
            ));
        }

        if (!request.getTeacherId().equals(wallet.getTeacherId())) {
            critical.add(alert(
                    "PAYOUT_WALLET_OWNER_MISMATCH",
                    "CRITICAL",
                    "The wallet does not belong to the withdrawal owner."
            ));
        }

        if (wallet.isFrozen()) {
            critical.add(alert(
                    "PAYOUT_WALLET_FROZEN",
                    "CRITICAL",
                    "The teacher wallet is frozen."
            ));
        }

        if (request.getRequestedAmount() == null
                || request.getRequestedAmount().signum() <= 0) {
            critical.add(alert(
                    "PAYOUT_INVALID_REQUEST_AMOUNT",
                    "CRITICAL",
                    "The withdrawal amount is invalid."
            ));
        } else if (wallet.getFrozenBalance().compareTo(request.getRequestedAmount()) < 0) {
            critical.add(alert(
                    "PAYOUT_RESERVED_BALANCE_MISMATCH",
                    "CRITICAL",
                    "Reserved balance is lower than the withdrawal amount."
            ));
        }

        if (!"VND".equalsIgnoreCase(wallet.getCurrency())) {
            critical.add(alert(
                    "PAYOUT_CURRENCY_MISMATCH",
                    "CRITICAL",
                    "The wallet currency does not match the payout currency."
            ));
        }

        BankAccountSnapshot bank = request.getBankAccountSnapshot();
        if (bank == null
                || isBlank(bank.getBankName())
                || isBlank(bank.getAccountHolderName())
                || isBlank(bank.getAccountNumber())) {
            critical.add(alert(
                    "PAYOUT_BANK_DESTINATION_MISSING",
                    "CRITICAL",
                    "Verified destination bank information is incomplete."
            ));
        }

        Optional<WalletTransaction> reservation = walletTransactionRepository
                .findByReferenceTypeAndReferenceIdAndTransactionType(
                        WITHDRAWAL_REFERENCE,
                        request.getId(),
                        WalletTransactionType.WITHDRAWAL_RESERVATION
                );
        if (reservation.isEmpty()) {
            critical.add(alert(
                    "PAYOUT_RESERVATION_LEDGER_MISSING",
                    "CRITICAL",
                    "The withdrawal reservation ledger entry is missing."
            ));
        } else if (!matchesReservation(reservation.get(), request, wallet)) {
            critical.add(alert(
                    "PAYOUT_RESERVATION_LEDGER_MISMATCH",
                    "CRITICAL",
                    "The withdrawal reservation ledger amount is inconsistent."
            ));
        }

        BigDecimal pendingClearing = escrowLedgerRepository.sumAmountByTeacherIdAndStatus(
                request.getTeacherId(),
                EscrowStatus.HELD
        );
        if (pendingClearing == null) {
            pendingClearing = BigDecimal.ZERO;
        }
        if (pendingClearing.signum() > 0) {
            warnings.add(alert(
                    "PAYOUT_PENDING_ESCROW_PRESENT",
                    "WARNING",
                    "The teacher has other revenue that is still pending escrow clearing."
            ));
        }

        List<ReconciliationAlert> alerts = new ArrayList<>(critical);
        alerts.addAll(warnings);
        ReconciliationStatus status = !critical.isEmpty()
                ? ReconciliationStatus.CRITICAL_MISMATCH
                : warnings.isEmpty() ? ReconciliationStatus.MATCHED : ReconciliationStatus.WARNING;

        return new ReconciliationResult(
                status,
                List.copyOf(alerts),
                pendingClearing,
                pendingClearing.signum() > 0 ? "PARTIALLY_PENDING" : "CLEARED",
                accountBlocked
        );
    }

    private boolean matchesReservation(
            WalletTransaction reservation,
            WithdrawalRequest request,
            TeacherWallet wallet
    ) {
        return reservation.getWalletId() != null
                && reservation.getWalletId().equals(wallet.getId())
                && reservation.getDirection() == WalletDirection.OUT
                && reservation.getAmount() != null
                && reservation.getAmount().abs().compareTo(request.getRequestedAmount()) == 0;
    }

    private ReconciliationAlert alert(String code, String severity, String message) {
        return new ReconciliationAlert(code, severity, message);
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
