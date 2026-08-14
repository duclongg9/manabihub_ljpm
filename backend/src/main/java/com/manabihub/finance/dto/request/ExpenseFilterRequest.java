package com.manabihub.finance.dto.request;

import com.manabihub.finance.enums.ExpenseCategory;
import com.manabihub.finance.enums.ExpenseStatus;
import lombok.Getter;
import lombok.Setter;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

@Getter
@Setter
public class ExpenseFilterRequest {
    private ExpenseStatus status;
    private ExpenseCategory category;
    private String keyword;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate incurredFrom;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate incurredTo;
}
