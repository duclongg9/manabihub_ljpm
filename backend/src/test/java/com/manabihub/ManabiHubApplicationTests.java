package com.manabihub;

import com.manabihub.kyc.service.TeacherKycService;
import com.manabihub.mock.repository.MockJlptRegistryRepository;
import com.manabihub.mock.repository.MockNationalIdRegistryRepository;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

import org.springframework.boot.test.mock.mockito.MockBean;
import com.manabihub.notification.repository.NotificationRepository;
import com.manabihub.common.mail.EmailService;

@SpringBootTest(properties = {
    "spring.autoconfigure.exclude=" +
    "org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration," +
    "org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration," +
    "org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration"
})
class ManabiHubApplicationTests {

    @MockBean
    private TeacherKycService teacherKycService;

    @MockBean
    private MockNationalIdRegistryRepository mockNationalIdRegistryRepository;

    @MockBean
    private MockJlptRegistryRepository mockJlptRegistryRepository;

    @MockBean
    private NotificationRepository notificationRepository;

    @MockBean
    private EmailService emailService;

    @MockBean
    private jakarta.persistence.EntityManager entityManager;

    @MockBean
    private jakarta.persistence.EntityManagerFactory entityManagerFactory;

    @Test
    void contextLoads() {
        // Basic integration test to verify the Spring Application Context loads correctly
    }
}
