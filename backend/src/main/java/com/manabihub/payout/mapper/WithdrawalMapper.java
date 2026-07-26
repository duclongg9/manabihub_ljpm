package com.manabihub.payout.mapper;

import com.manabihub.payout.dto.response.WithdrawalRequestResponse;
import com.manabihub.payout.entity.WithdrawalRequest;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface WithdrawalMapper {
    @Mapping(target = "bankCode", source = "bankAccountSnapshot.bankCode")
    @Mapping(target = "bankName", source = "bankAccountSnapshot.bankName")
    @Mapping(target = "accountHolderName", source = "bankAccountSnapshot.accountHolderName")
    @Mapping(target = "accountNumberMasked", source = "bankAccountSnapshot.accountNumber") // In real life, mask it here or keep it masked in snapshot
    @Mapping(target = "branch", source = "bankAccountSnapshot.branch")
    @Mapping(target = "reviewedAt", source = "decidedAt")
    @Mapping(target = "rejectionReason", source = "decisionNote")
    @Mapping(target = "currency", constant = "VND")
    WithdrawalRequestResponse toResponse(WithdrawalRequest request);
}
