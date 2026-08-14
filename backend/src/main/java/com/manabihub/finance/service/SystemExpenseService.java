package com.manabihub.finance.service;

import com.manabihub.common.response.PageResponse;
import com.manabihub.finance.dto.request.ExpenseFilterRequest;
import com.manabihub.finance.dto.request.UpsertExpenseRequest;
import com.manabihub.finance.dto.response.ExpenseDetailResponse;
import com.manabihub.finance.dto.response.ExpenseSummaryResponse;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface SystemExpenseService {
    PageResponse<ExpenseSummaryResponse> search(ExpenseFilterRequest filter, Pageable pageable);

    ExpenseDetailResponse get(UUID id);

    ExpenseDetailResponse create(UpsertExpenseRequest request);

    ExpenseDetailResponse update(UUID id, UpsertExpenseRequest request);

    ExpenseDetailResponse confirm(UUID id);

    ExpenseDetailResponse markPaid(UUID id);

    ExpenseDetailResponse voidExpense(UUID id, String reason);
}
