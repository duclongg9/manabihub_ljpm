package com.manabihub;

import com.manabihub.audit.repository.AuditLogRepository;
import com.manabihub.common.mail.EmailService;
import com.manabihub.identity.repository.AppUserRepository;
import com.manabihub.identity.repository.InternalAdminAccountRepository;
import com.manabihub.identity.repository.RoleRepository;
import com.manabihub.identity.repository.StudentProfileRepository;
import com.manabihub.identity.repository.UserRepository;
import com.manabihub.kyc.repository.KycDocumentRepository;
import com.manabihub.kyc.repository.KycRequestRepository;
import com.manabihub.kyc.repository.TeacherProfileRepository;
import com.manabihub.kyc.service.TeacherKycService;
import com.manabihub.mock.repository.MockJlptRegistryRepository;
import com.manabihub.mock.repository.MockNationalIdRegistryRepository;
import com.manabihub.notification.repository.NotificationRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

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
    private com.manabihub.kyc.repository.InternalAdminAccountRepository kycInternalAdminAccountRepository;

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
    private AppUserRepository appUserRepository;

    @MockBean
    private InternalAdminAccountRepository identityInternalAdminAccountRepository;

    @MockBean
    private RoleRepository roleRepository;

    @MockBean
    private StudentProfileRepository studentProfileRepository;

    @MockBean
    private MockNationalIdRegistryRepository mockNationalIdRegistryRepository;

    @MockBean
    private MockJlptRegistryRepository mockJlptRegistryRepository;

    @MockBean
    private EmailService emailService;

    @MockBean
    private EntityManager entityManager;

    @MockBean
    private EntityManagerFactory entityManagerFactory;

    @Test
    void contextLoads() {
        // Basic integration test to verify the Spring Application Context loads correctly.
    }
}
