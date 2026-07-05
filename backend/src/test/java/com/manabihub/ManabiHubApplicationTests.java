package com.manabihub;

import com.manabihub.kyc.service.TeacherKycService;
import com.manabihub.mock.repository.MockJlptRegistryRepository;
import com.manabihub.mock.repository.MockNationalIdRegistryRepository;
import com.manabihub.identity.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import com.manabihub.kyc.repository.KycRequestRepository;
import com.manabihub.audit.repository.AuditLogRepository;
import com.manabihub.notification.repository.NotificationRepository;
import com.manabihub.kyc.repository.InternalAdminAccountRepository;
import com.manabihub.kyc.repository.TeacherProfileRepository;
import com.manabihub.kyc.repository.KycDocumentRepository;

@SpringBootTest(properties = {
    "spring.autoconfigure.exclude=" +
    "org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration," +
    "org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration," +
    "org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration"
})
class ManabiHubApplicationTests {


    @MockBean
    private KycRequestRepository kycRequestRepository;

    @MockBean
    private InternalAdminAccountRepository internalAdminAccountRepository;

    @MockBean
    private TeacherProfileRepository teacherProfileRepository;

    @MockBean
    private KycDocumentRepository kycDocumentRepository;

    @MockBean
    private AuditLogRepository auditLogRepository;

    @MockBean
    private NotificationRepository notificationRepository;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private TeacherKycService teacherKycService;

    @MockBean
    private MockNationalIdRegistryRepository mockNationalIdRegistryRepository;

    @MockBean
    private MockJlptRegistryRepository mockJlptRegistryRepository;

    @Test
    void contextLoads() {
        // Basic integration test to verify the Spring Application Context loads correctly
    }
}
