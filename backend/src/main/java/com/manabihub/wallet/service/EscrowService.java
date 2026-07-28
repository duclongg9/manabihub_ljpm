package com.manabihub.wallet.service;

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
     * Reverses held escrow funds for an order that is being refunded.
     * Only affects entries in HELD state.
     */
    List<EscrowLedger> reverseHold(Order order);
}
