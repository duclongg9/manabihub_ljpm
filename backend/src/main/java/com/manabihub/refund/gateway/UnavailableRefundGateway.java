package com.manabihub.refund.gateway;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnMissingBean(RefundGateway.class)
public class UnavailableRefundGateway implements RefundGateway {

    @Override
    public String provider() {
        return "UNAVAILABLE";
    }

    @Override
    public RefundGatewayResult refund(RefundGatewayCommand command) {
        return RefundGatewayResult.unavailable("REFUND_GATEWAY_NOT_CONFIGURED");
    }
}
