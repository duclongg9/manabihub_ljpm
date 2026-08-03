const fs = require('fs');
function replaceInFile(path, oldStr, newStr) {
    let content = fs.readFileSync(path, 'utf8');
    content = content.split(oldStr).join(newStr);
    fs.writeFileSync(path, content, 'utf8');
}
replaceInFile("backend/src/test/java/com/manabihub/kyc/service/VnptServerVerificationTest.java", '"001090123456"', '"012345678901"');
replaceInFile("backend/src/test/java/com/manabihub/kyc/service/TeacherKycServiceTest.java", '"001090123456"', '"012345678901"');
console.log("Done");
