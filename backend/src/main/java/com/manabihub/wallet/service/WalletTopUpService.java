package com.manabihub.wallet.service;

import com.manabihub.payment.dto.IpnAckResponse;
import com.manabihub.wallet.dto.request.CreateTopUpRequest;
import com.manabihub.wallet.dto.response.WalletTopUpResponse;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Wallet top-up flow for students (UC-17, alternative flow 4a).
 * <p>
 * Splitting this from {@link StudentWalletService} keeps the read model (balances, history)
 * free of write concerns, and keeps the money-in path in one auditable place.
 */
public interface WalletTopUpService {

    /**
     * Prefix on every top-up reference sent to the payment provider. The provider posts all
     * callbacks to one URL, so this is what lets the callback endpoint tell a wallet top-up
     * apart from a course order without a database round-trip.
     */
    String CODE_PREFIX = "TU";

    /**
     * Reference type stamped on the credit ledger line a successful top-up produces.
     * {@code WalletTransactionMapper} keys on this to bucket the entry into the student's
     * "top-up" section, so the constant lives here rather than in the implementation.
     */
    String REFERENCE_TYPE = "WALLET_TOPUP";

    /**
     * Records a PENDING top-up against the current student's own wallet and returns it with
     * the provider payment URL the browser must be redirected to. No balance is credited here.
     */
    WalletTopUpResponse createTopUp(CreateTopUpRequest request, String clientIp);

    /** The current student's top-up requests, newest first. */
    List<WalletTopUpResponse> getMyTopUps();

    /** One top-up belonging to the current student — used to poll after the provider redirect. */
    WalletTopUpResponse getTopUpForCurrentStudent(UUID topUpId);

    /**
     * Processes a provider callback for a top-up reference. This is the ONLY path that credits
     * a wallet balance from a top-up: it verifies the checksum, re-checks the amount server-side
     * (NFR-SEC-14), and is idempotent — a replayed callback for an already-credited top-up is a
     * no-op (NFR-REL-06).
     *
     * @return the acknowledgement to send back to the provider
     */
    IpnAckResponse handleCallback(Map<String, String> params);

    /**
     * Local dev simulator: builds a correctly-signed callback for a top-up and runs it through
     * {@link #handleCallback(Map)}, so the flow can be tested without exposing localhost to the
     * provider.
     */
    IpnAckResponse simulateCallback(String topUpCode, boolean success);
}
