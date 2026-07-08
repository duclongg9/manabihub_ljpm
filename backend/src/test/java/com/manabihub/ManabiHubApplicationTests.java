package com.manabihub;

import com.manabihub.audit.repository.AuditLogRepository;
import com.manabihub.course.repository.CourseCategoryRepository;
import com.manabihub.course.repository.CourseModuleRepository;
import com.manabihub.course.repository.CourseRepository;
import com.manabihub.course.repository.LessonBlockRepository;
import com.manabihub.identity.mapper.StudentProfileMapper;
import com.manabihub.identity.mapper.TeacherProfileMapper;
import com.manabihub.identity.repository.AppUserRepository;
import com.manabihub.identity.repository.IdentityTeacherProfileRepository;
import com.manabihub.identity.repository.InternalAdminAccountRepository;
import com.manabihub.identity.repository.RoleRepository;
import com.manabihub.identity.repository.StudentProfileRepository;
import com.manabihub.identity.repository.UserRepository;
import com.manabihub.identity.service.CurrentUserService;
import com.manabihub.kyc.repository.KycDocumentRepository;
import com.manabihub.kyc.repository.KycRequestRepository;
import com.manabihub.kyc.repository.TeacherProfileRepository;
import com.manabihub.kyc.service.TeacherKycService;
import com.manabihub.mock.repository.MockJlptRegistryRepository;
import com.manabihub.mock.repository.MockNationalIdRegistryRepository;
import com.manabihub.notification.repository.NotificationRepository;
import com.manabihub.notification.service.NotificationService;
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
    private NotificationService notificationService;

    @MockBean
    private AppUserRepository appUserRepository;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private InternalAdminAccountRepository identityInternalAdminAccountRepository;

    @MockBean
    private RoleRepository roleRepository;

    @MockBean
    private StudentProfileRepository studentProfileRepository;

    @MockBean
    private IdentityTeacherProfileRepository identityTeacherProfileRepository;

    @MockBean
    private TeacherKycService teacherKycService;

    @MockBean
    private MockNationalIdRegistryRepository mockNationalIdRegistryRepository;

    @MockBean
    private MockJlptRegistryRepository mockJlptRegistryRepository;

    @MockBean
    private StudentProfileMapper studentProfileMapper;

    @MockBean
    private TeacherProfileMapper teacherProfileMapper;

    @MockBean
    private CurrentUserService currentUserService;

    @MockBean
    private CourseRepository courseRepository;

    @MockBean
    private CourseCategoryRepository courseCategoryRepository;

    @MockBean
    private CourseModuleRepository courseModuleRepository;

    @MockBean
    private LessonBlockRepository lessonBlockRepository;

    @Test
    void contextLoads() {
        // Basic integration test to verify the Spring Application Context loads correctly.
    }
}
