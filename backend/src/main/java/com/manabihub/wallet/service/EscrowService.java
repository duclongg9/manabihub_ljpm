package com.manabihub.wallet.service;

import com.manabihub.kyc.domain.TeacherProfile;
import com.manabihub.order.entity.Order;
import com.manabihub.wallet.entity.EscrowLedger;

import java.util.List;

/**
 * Holds a paid order's funds in escrow for the teacher(s) of the purchased course(s).
 */
public interface EscrowService {

    /**
     * Creates a {@code HELD} escrow ledger entry per order item and freezes the
     * corresponding amount in each teacher's wallet. Idempotent: calling it again
     * for an order that already has escrow entries is a no-op and returns the
     * existing entries.
     */
    List<EscrowLedger> holdForOrder(Order order);

    /**
     * Returns the teacher's escrow entries that are not yet released (status
     * {@code HELD} or {@code FROZEN}) for the UC-17 "pending escrow" section,
     * newest first.
     */
    List<EscrowLedger> findPendingEscrowForTeacher(TeacherProfile teacher);
}
