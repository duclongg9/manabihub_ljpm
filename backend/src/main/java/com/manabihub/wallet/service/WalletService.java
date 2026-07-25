package com.manabihub.wallet.service;

import com.manabihub.common.response.PageResponse;
import com.manabihub.wallet.dto.request.CreateWalletTopUpRequest;
import com.manabihub.wallet.dto.response.StudentWalletOverviewResponse;
import com.manabihub.wallet.dto.response.TeacherWalletOverviewResponse;
import com.manabihub.wallet.dto.response.WalletTopUpResponse;
import com.manabihub.wallet.dto.response.WalletTransactionResponse;
import com.manabihub.wallet.dto.response.WithdrawalRequestResponse;
import com.manabihub.wallet.enums.WalletTransactionDirection;
import com.manabihub.wallet.enums.WalletTransactionType;
import org.springframework.data.domain.Pageable;

import java.time.Instant;

/**
 * UC-17 Manage My Wallet.
 * <p>
 * Every method resolves the wallet from the authenticated principal, never from
 * a client-supplied owner id (NFR-SEC-24, BR-RBAC-01). The Student and Teacher
 * halves are separate methods so a role can only reach its own actions.
 */
public interface WalletService {

    /**
     * Student wallet overview: balance plus top-up, payment and refund totals.
     * Creates an empty wallet on first access so the screen never 404s.
     */
    StudentWalletOverviewResponse getStudentWalletOverview();

    /**
     * Teacher wallet overview: Available Balance, Pending Clearing escrow,
     * frozen amount and whether a withdrawal is currently allowed.
     */
    TeacherWalletOverviewResponse getTeacherWalletOverview();

    /**
     * Paginated Student transaction history, restricted to Student-visible
     * transaction types.
     *
     * @param type      optional transaction type filter
     * @param direction optional IN/OUT filter
     * @param from      optional inclusive lower bound on {@code createdAt}
     * @param to        optional inclusive upper bound on {@code createdAt}
     */
    PageResponse<WalletTransactionResponse> getStudentTransactions(
            WalletTransactionType type,
            WalletTransactionDirection direction,
            Instant from,
            Instant to,
            Pageable pageable
    );

    /**
     * Paginated Teacher transaction history, restricted to Teacher-visible
     * transaction types.
     */
    PageResponse<WalletTransactionResponse> getTeacherTransactions(
            WalletTransactionType type,
            WalletTransactionDirection direction,
            Instant from,
            Instant to,
            Pageable pageable
    );

    /**
     * Teacher withdrawal history with the payout status of each request.
     */
    PageResponse<WithdrawalRequestResponse> getTeacherWithdrawals(Pageable pageable);

    /**
     * Student top-up history.
     */
    PageResponse<WalletTopUpResponse> getStudentTopUps(Pageable pageable);

    /**
     * UC-17 alternative flow 4a: create a pending top-up request. The balance is
     * not credited here; only a confirmed gateway callback may do that.
     */
    WalletTopUpResponse createTopUpRequest(CreateWalletTopUpRequest request);
}
