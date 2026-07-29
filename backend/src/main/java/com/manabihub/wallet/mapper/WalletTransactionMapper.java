package com.manabihub.wallet.mapper;

import com.manabihub.order.entity.Order;
import com.manabihub.wallet.dto.response.WalletActivityResponse;
import com.manabihub.wallet.entity.WalletTransaction;
import com.manabihub.wallet.enums.WalletTransactionSection;
import com.manabihub.wallet.enums.WalletTransactionType;
import com.manabihub.wallet.service.WalletTopUpService;
import org.springframework.stereotype.Component;

/**
 * Maps wallet ledger lines and order/payment records onto the UI-facing
 * {@link WalletActivityResponse} shape, classifying each into a
 * {@link WalletTransactionSection} for the UC-17 "My Wallet" view.
 */
@Component
public class WalletTransactionMapper {

    /** Reference type stamped on the wallet top-up flow's ADJUSTMENT credit lines (UC-17). */
    private static final String TOP_UP_REFERENCE_TYPE = WalletTopUpService.REFERENCE_TYPE;

    public WalletTransactionSection classify(WalletTransaction transaction) {
        WalletTransactionType type = transaction.getTransactionType();
        return switch (type) {
            case PURCHASE -> WalletTransactionSection.PAYMENT;
            case REFUND -> WalletTransactionSection.REFUND;
            case ESCROW_HOLD -> WalletTransactionSection.ESCROW_HOLD;
            case ESCROW_RELEASE -> WalletTransactionSection.ESCROW_RELEASE;
            case PAYOUT -> WalletTransactionSection.WITHDRAWAL;
            case REVENUE_SHARE -> WalletTransactionSection.REVENUE_SHARE;
            case ADJUSTMENT -> isTopUp(transaction)
                    ? WalletTransactionSection.TOP_UP
                    : WalletTransactionSection.ADJUSTMENT;
        };
    }

    public WalletActivityResponse toActivityResponse(WalletTransaction transaction) {
        return new WalletActivityResponse(
                transaction.getId(),
                classify(transaction),
                transaction.getTransactionType().name(),
                transaction.getAmount(),
                transaction.getWallet().getCurrency(),
                transaction.getDirection().name(),
                "COMPLETED",
                transaction.getReferenceId() != null ? transaction.getReferenceId().toString() : null,
                transaction.getNote(),
                transaction.getCreatedAt()
        );
    }

    /**
     * Maps a student's {@link Order} onto a wallet activity line for the "payment" or
     * "refund" section — no wallet-level PURCHASE/REFUND ledger line is recorded for
     * students yet, so order/payment records are the source of truth for these sections.
     */
    public WalletActivityResponse toActivityResponse(Order order, WalletTransactionSection section) {
        return new WalletActivityResponse(
                order.getId(),
                section,
                "ORDER",
                order.getTotalAmount(),
                order.getCurrency(),
                section == WalletTransactionSection.REFUND ? "IN" : "OUT",
                order.getStatus().name(),
                order.getOrderCode(),
                null,
                order.getUpdatedAt() != null ? order.getUpdatedAt() : order.getCreatedAt()
        );
    }

    private boolean isTopUp(WalletTransaction transaction) {
        return TOP_UP_REFERENCE_TYPE.equalsIgnoreCase(transaction.getReferenceType());
    }
}
