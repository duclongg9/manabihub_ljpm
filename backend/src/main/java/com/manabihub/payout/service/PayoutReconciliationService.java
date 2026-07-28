package com.manabihub.payout.service;

import com.manabihub.kyc.domain.TeacherProfile;
import com.manabihub.payout.entity.WithdrawalRequest;
import com.manabihub.payout.enums.ReconciliationStatus;
import com.manabihub.wallet.entity.TeacherWallet;

import java.math.BigDecimal;
import java.util.List;

public interface PayoutReconciliationService {

    ReconciliationResult reconcile(
            WithdrawalRequest request,
            TeacherWallet wallet,
            TeacherProfile teacher
    );

    record ReconciliationAlert(String code, String severity, String message) {
    }

    record ReconciliationResult(
            ReconciliationStatus status,
            List<ReconciliationAlert> alerts,
            BigDecimal pendingClearing,
            String escrowStatus,
            boolean teacherAccountBlocked
    ) {
        public boolean hasCriticalMismatch() {
            return status == ReconciliationStatus.CRITICAL_MISMATCH;
        }
    }
}
