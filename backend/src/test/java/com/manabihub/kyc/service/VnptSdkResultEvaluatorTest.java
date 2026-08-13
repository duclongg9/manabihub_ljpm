package com.manabihub.kyc.service;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class VnptSdkResultEvaluatorTest {

    @Test
    void terminalFailureOverridesEarlierDocumentAndFaceSuccess() {
        for (String terminalStatus : new String[]{
                "CANCEL", "CANCELLED", "CANCELED", "USER_CANCELLED",
                "ABORT", "ABORTED", "TIMEOUT", "TIMED_OUT",
                "ERROR", "ERROR_PROVIDER", "NETWORK_ERROR"
        }) {
            VnptSdkDecision decision = VnptSdkResultEvaluator.evaluate(
                    payloadWithTerminalStatus(terminalStatus));

            assertFalse(decision.verified(), terminalStatus);
        }
    }

    @Test
    void explicitNoErrorStatusDoesNotOverrideSuccessfulEvidence() {
        VnptSdkDecision decision = VnptSdkResultEvaluator.evaluate(
                payloadWithTerminalStatus("NO_ERROR"));

        assertTrue(decision.verified());
    }

    private Map<String, Object> payloadWithTerminalStatus(String status) {
        return Map.of(
                "documentResult", Map.of(
                        "idNumber", "027204002711",
                        "fullName", "NGUYEN XUAN DAT",
                        "dateOfBirth", "2004-08-31"),
                "callbackResult", Map.of(
                        "faceLiveness", Map.of("status", "SUCCESS"),
                        "faceCompare", Map.of("result", "MATCH")),
                "endFlowResult", Map.of("status", status));
    }
}
