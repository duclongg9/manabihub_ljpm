import os
import re

# 1. Rename V054
v54 = "backend/src/main/resources/db/migration/V054__add_vnpt_server_verification.sql"
v56 = "backend/src/main/resources/db/migration/V056__add_vnpt_server_verification.sql"
if os.path.exists(v54):
    os.rename(v54, v56)
    with open(v56, "a") as f:
        f.write("\n-- MHB-73: Unique constraint to prevent cross-user and concurrent replay of VNPT transactions\n")
        f.write("CREATE UNIQUE INDEX IF NOT EXISTS uq_kyc_requests_provider_tx\n")
        f.write("    ON kyc_requests (ekyc_provider, provider_transaction_id)\n")
        f.write("    WHERE provider_transaction_id IS NOT NULL AND provider_transaction_id != '';\n")

# 2 & 3. Adapters
mock_adapter = "backend/src/main/java/com/manabihub/kyc/service/impl/MockVnptVerificationAdapter.java"
if os.path.exists(mock_adapter): os.remove(mock_adapter)

fail_closed = "backend/src/main/java/com/manabihub/kyc/service/impl/FailClosedVnptVerificationAdapter.java"
with open(fail_closed, "w") as f:
    f.write('''package com.manabihub.kyc.service.impl;
import com.manabihub.kyc.port.VnptServerVerificationResult;
import com.manabihub.kyc.port.VnptVerificationPort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.stereotype.Component;
import java.util.List;

@Component
@ConditionalOnMissingBean(VnptVerificationPort.class)
public class FailClosedVnptVerificationAdapter implements VnptVerificationPort {
    private static final Logger log = LoggerFactory.getLogger(FailClosedVnptVerificationAdapter.class);
    @Override
    public VnptServerVerificationResult verifyTransaction(String providerTransactionId, String providerSessionId) {
        log.warn("Using FailClosedVnptVerificationAdapter. VNPT server verification is NOT CONFIGURED.");
        return VnptServerVerificationResult.failure(providerTransactionId, "NOT_CONFIGURED", "PROVIDER_NOT_CONFIGURED", List.of("VNPT verification provider is not configured."));
    }
}
''')

# 4. Result DTO
with open("backend/src/main/java/com/manabihub/kyc/port/VnptServerVerificationResult.java", "w") as f:
    f.write('''package com.manabihub.kyc.port;
import java.util.List;
public record VnptServerVerificationResult(
        boolean verified,
        String transactionId,
        String providerStatus,
        String reasonCode,
        String verifiedAt,
        String serverIdNumber,
        String maskedReference,
        List<String> failureReasons
) {
    public static VnptServerVerificationResult success(String transactionId, String providerStatus, String verifiedAt, String serverIdNumber, String maskedReference) {
        return new VnptServerVerificationResult(true, transactionId, providerStatus, null, verifiedAt, serverIdNumber, maskedReference, List.of());
    }
    public static VnptServerVerificationResult failure(String transactionId, String providerStatus, String reasonCode, List<String> reasons) {
        return new VnptServerVerificationResult(false, transactionId, providerStatus, reasonCode, null, null, null, reasons);
    }
}
''')

# 5. Fix tests easily
def replace_in_file(path, old, new):
    if not os.path.exists(path): return
    with open(path, "r", encoding="utf-8") as f: content = f.read()
    with open(path, "w", encoding="utf-8") as f: f.write(content.replace(old, new))

replace_in_file("backend/src/test/java/com/manabihub/kyc/service/VnptServerVerificationTest.java",
    "Map.of(\\"mock\\", true)", "\\"SUCCESS\\", \\"2023-01-01T00:00:00Z\\", \\"001090123456\\", \\"ref\\"")
replace_in_file("backend/src/test/java/com/manabihub/kyc/service/VnptServerVerificationTest.java",
    "Map.of()", "\\"SUCCESS\\", \\"2023-01-01T00:00:00Z\\", \\"001090123456\\", \\"ref\\"")
replace_in_file("backend/src/test/java/com/manabihub/kyc/service/VnptServerVerificationTest.java",
    "VnptServerVerificationResult.failure(\\"tx-123\\", List.of(\\"Transaction not found\\"))",
    "VnptServerVerificationResult.failure(\\"tx-123\\", \\"FAILED\\", \\"TX_NOT_FOUND\\", List.of(\\"Transaction not found\\"))")

replace_in_file("backend/src/test/java/com/manabihub/kyc/service/TeacherKycServiceTest.java",
    "VnptServerVerificationResult.success(\\"transaction\\", Map.of(\\"mock\\", true))",
    "VnptServerVerificationResult.success(\\"transaction\\", \\"SUCCESS\\", \\"2023-01-01T00:00:00Z\\", \\"001090123456\\", \\"ref\\")")

