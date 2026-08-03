const fs = require('fs');

function replaceInFile(path, oldStr, newStr) {
    if (fs.existsSync(path)) {
        let content = fs.readFileSync(path, 'utf8');
        content = content.split(oldStr).join(newStr);
        fs.writeFileSync(path, content, 'utf8');
    }
}

replaceInFile("backend/src/test/java/com/manabihub/kyc/service/VnptServerVerificationTest.java",
    'Map.of("mock", true)', '"SUCCESS", "2023-01-01T00:00:00Z", "001090123456", "ref"');

replaceInFile("backend/src/test/java/com/manabihub/kyc/service/VnptServerVerificationTest.java",
    'Map.of()', '"SUCCESS", "2023-01-01T00:00:00Z", "001090123456", "ref"');

replaceInFile("backend/src/test/java/com/manabihub/kyc/service/VnptServerVerificationTest.java",
    'VnptServerVerificationResult.failure("tx-123", List.of("Transaction not found"))',
    'VnptServerVerificationResult.failure("tx-123", "FAILED", "TX_NOT_FOUND", List.of("Transaction not found"))');

replaceInFile("backend/src/test/java/com/manabihub/kyc/service/TeacherKycServiceTest.java",
    'VnptServerVerificationResult.success("transaction", Map.of("mock", true))',
    'VnptServerVerificationResult.success("transaction", "SUCCESS", "2023-01-01T00:00:00Z", "001090123456", "ref")');

console.log("Tests refactored.");
