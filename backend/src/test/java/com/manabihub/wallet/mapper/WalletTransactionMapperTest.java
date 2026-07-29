package com.manabihub.wallet.mapper;

import com.manabihub.order.entity.Order;
import com.manabihub.order.enums.OrderStatus;
import com.manabihub.wallet.dto.response.WalletActivityResponse;
import com.manabihub.wallet.entity.Wallet;
import com.manabihub.wallet.entity.WalletTransaction;
import com.manabihub.wallet.enums.WalletDirection;
import com.manabihub.wallet.enums.WalletOwnerType;
import com.manabihub.wallet.enums.WalletTransactionSection;
import com.manabihub.wallet.enums.WalletTransactionType;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;

class WalletTransactionMapperTest {

    private final WalletTransactionMapper mapper = new WalletTransactionMapper();

    @Test
    void classify_purchaseIsPayment() {
        assertEquals(WalletTransactionSection.PAYMENT, mapper.classify(transaction(WalletTransactionType.PURCHASE, null)));
    }

    @Test
    void classify_refundIsRefund() {
        assertEquals(WalletTransactionSection.REFUND, mapper.classify(transaction(WalletTransactionType.REFUND, null)));
    }

    @Test
    void classify_payoutIsWithdrawal() {
        assertEquals(WalletTransactionSection.WITHDRAWAL, mapper.classify(transaction(WalletTransactionType.PAYOUT, null)));
    }

    @Test
    void classify_escrowHoldAndRelease() {
        assertEquals(WalletTransactionSection.ESCROW_HOLD, mapper.classify(transaction(WalletTransactionType.ESCROW_HOLD, null)));
        assertEquals(WalletTransactionSection.ESCROW_RELEASE, mapper.classify(transaction(WalletTransactionType.ESCROW_RELEASE, null)));
    }

    @Test
    void classify_revenueShare() {
        assertEquals(WalletTransactionSection.REVENUE_SHARE, mapper.classify(transaction(WalletTransactionType.REVENUE_SHARE, null)));
    }

    @Test
    void classify_adjustmentWithTopUpReference_isTopUp() {
        WalletTransaction tx = transaction(WalletTransactionType.ADJUSTMENT, "WALLET_TOPUP");
        assertEquals(WalletTransactionSection.TOP_UP, mapper.classify(tx));
    }

    @Test
    void classify_adjustmentWithoutTopUpReference_isAdjustment() {
        WalletTransaction tx = transaction(WalletTransactionType.ADJUSTMENT, "MANUAL_CORRECTION");
        assertEquals(WalletTransactionSection.ADJUSTMENT, mapper.classify(tx));
    }

    @Test
    void toActivityResponse_fromOrder_marksRefundAsInboundAndPaymentAsOutbound() {
        Order order = Order.builder()
                .id(UUID.randomUUID())
                .orderCode("OD1")
                .totalAmount(new BigDecimal("150000.00"))
                .currency("VND")
                .status(OrderStatus.PAID)
                .createdAt(Instant.parse("2026-07-01T00:00:00Z"))
                .build();

        WalletActivityResponse payment = mapper.toActivityResponse(order, WalletTransactionSection.PAYMENT);
        assertEquals("OUT", payment.direction());
        assertEquals("OD1", payment.referenceCode());
        assertEquals(WalletTransactionSection.PAYMENT, payment.section());

        WalletActivityResponse refund = mapper.toActivityResponse(order, WalletTransactionSection.REFUND);
        assertEquals("IN", refund.direction());
    }

    private WalletTransaction transaction(WalletTransactionType type, String referenceType) {
        Wallet wallet = Wallet.builder()
                .id(UUID.randomUUID())
                .ownerType(WalletOwnerType.TEACHER)
                .currency("VND")
                .build();
        return WalletTransaction.builder()
                .id(UUID.randomUUID())
                .wallet(wallet)
                .transactionType(type)
                .amount(new BigDecimal("10000.00"))
                .direction(WalletDirection.IN)
                .referenceType(referenceType)
                .createdAt(Instant.now())
                .build();
    }
}
