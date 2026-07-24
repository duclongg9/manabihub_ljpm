package com.manabihub.wallet.mapper;

import com.manabihub.wallet.dto.response.TeacherWalletResponse;
import com.manabihub.wallet.entity.TeacherWallet;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.math.BigDecimal;
import java.time.LocalDate;

@Mapper(componentModel = "spring")
public interface WalletMapper {

    @Mapping(target = "walletFrozen", constant = "false")
    @Mapping(target = "pendingBalance", constant = "0")
    @Mapping(target = "reservedBalance", source = "wallet.frozenBalance")
    @Mapping(target = "availableBalance", expression = "java(wallet.getAvailableBalance())")
    TeacherWalletResponse toResponse(TeacherWallet wallet, BigDecimal minimumPayoutAmount, int clearingPeriodDays, LocalDate nextPayoutDate);
}
