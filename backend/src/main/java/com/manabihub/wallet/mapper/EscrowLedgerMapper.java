package com.manabihub.wallet.mapper;

import com.manabihub.course.entity.Course;
import com.manabihub.order.entity.Order;
import com.manabihub.wallet.dto.response.EscrowEntryResponse;
import com.manabihub.wallet.entity.EscrowLedger;
import org.springframework.stereotype.Component;

@Component
public class EscrowLedgerMapper {

    public EscrowEntryResponse toResponse(EscrowLedger ledger) {
        Course course = ledger.getCourse();
        Order order = ledger.getOrder();
        return new EscrowEntryResponse(
                ledger.getId(),
                order != null ? order.getId() : null,
                order != null ? order.getOrderCode() : null,
                course != null ? course.getId() : null,
                course != null ? course.getTitle() : null,
                ledger.getAmount(),
                course != null ? course.getCurrency() : "VND",
                ledger.getStatus(),
                ledger.getReleaseAt(),
                ledger.getCreatedAt()
        );
    }
}
