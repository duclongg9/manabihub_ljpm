package com.manabihub.payout.entity;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BankAccountSnapshot {
    private String bankCode;
    private String bankName;
    private String accountHolderName;
    private String accountNumber;
    private String branch;
}
