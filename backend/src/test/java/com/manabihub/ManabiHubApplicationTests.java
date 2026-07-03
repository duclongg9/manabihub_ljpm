package com.manabihub;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import com.manabihub.identity.repository.UserRepository;
import com.manabihub.kyc.repository.KycRequestRepository;
import com.manabihub.audit.repository.AuditLogRepository;
import com.manabihub.notification.repository.NotificationRepository;

@SpringBootTest(properties = {
    "spring.autoconfigure.exclude=" +
    "org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration," +
    "org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration," +
    "org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration"
})
class ManabiHubApplicationTests {

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private KycRequestRepository kycRequestRepository;

    @MockBean
    private AuditLogRepository auditLogRepository;

    @MockBean
    private NotificationRepository notificationRepository;

    @Test
    void contextLoads() {
        // Basic integration test to verify the Spring Application Context loads correctly
    }
}
