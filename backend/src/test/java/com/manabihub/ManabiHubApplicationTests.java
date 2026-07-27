package com.manabihub;

import com.manabihub.audit.repository.AuditLogRepository;
import com.manabihub.ai.repository.AiUsageLogRepository;
import com.manabihub.course.repository.CourseCategoryRepository;
import com.manabihub.course.repository.CourseModuleRepository;
import com.manabihub.course.repository.CourseRepository;
import com.manabihub.course.repository.LessonBlockRepository;
import com.manabihub.finaltest.repository.FinalTestRepository;
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
import com.manabihub.kyc.repository.TeacherIdentityClaimRepository;
import com.manabihub.kyc.repository.KycRequestRepository;
import com.manabihub.kyc.repository.TeacherProfileRepository;
import com.manabihub.kyc.service.TeacherKycService;
import com.manabihub.mock.repository.MockJlptRegistryRepository;
import com.manabihub.mock.repository.MockNationalIdRegistryRepository;
import com.manabihub.notification.repository.NotificationRepository;
import com.manabihub.notification.service.NotificationService;
import com.manabihub.course.repository.CourseApprovalDecisionRepository;
import com.manabihub.learning.repository.EnrollmentRepository;
import com.manabihub.learning.repository.FinalTestAttemptRepository;
import com.manabihub.learning.repository.LessonBlockProgressRepository;
import com.manabihub.learning.repository.LearningCertificateRepository;
import com.manabihub.learning.repository.WishlistItemRepository;
import com.manabihub.learning.repository.QuizAttemptRepository;
import com.manabihub.systemconfig.repository.SystemSettingRepository;
import com.manabihub.writing.repository.AiWritingSuggestionRepository;
import com.manabihub.writing.repository.TeacherWritingFeedbackRepository;
import com.manabihub.writing.repository.WritingSubmissionRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;

@SpringBootTest(properties = {
        "manabihub.kyc.identity-secret=test-secret-key-1234567890-32chars-min-length",
        "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration,"
                + "org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration,"
                + "org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration"
})
class ManabiHubApplicationTests {

    @MockBean
    private JdbcTemplate jdbcTemplate;

    @MockBean
    private EntityManager entityManager;

    @MockBean
    private KycRequestRepository kycRequestRepository;

    @MockBean
    private com.manabihub.kyc.repository.InternalAdminAccountRepository kycInternalAdminAccountRepository;

    @MockBean
    private TeacherProfileRepository teacherProfileRepository;

    @MockBean
    private KycDocumentRepository kycDocumentRepository;

    @MockBean
    private TeacherIdentityClaimRepository teacherIdentityClaimRepository;

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
    private CourseApprovalDecisionRepository courseApprovalDecisionRepository;

    @MockBean
    private CourseModuleRepository courseModuleRepository;

    @MockBean
    private LessonBlockRepository lessonBlockRepository;

    @MockBean
    private FinalTestRepository finalTestRepository;

    @MockBean
    private EnrollmentRepository enrollmentRepository;

    @MockBean
    private LessonBlockProgressRepository LessonBlockProgressRepository;

    @MockBean
    private QuizAttemptRepository quizAttemptRepository;

    @MockBean
    private FinalTestAttemptRepository finalTestAttemptRepository;

    @MockBean
    private LearningCertificateRepository learningCertificateRepository;

    @MockBean
    private WishlistItemRepository wishlistItemRepository;

    @MockBean
    private WritingSubmissionRepository writingSubmissionRepository;

    @MockBean
    private com.manabihub.learning.repository.FlashcardProgressRepository flashcardProgressRepository;

    @MockBean
    private AiWritingSuggestionRepository aiWritingSuggestionRepository;

    @MockBean
    private TeacherWritingFeedbackRepository teacherWritingFeedbackRepository;

    @MockBean
    private AiUsageLogRepository aiUsageLogRepository;

    @MockBean
    private SystemSettingRepository systemSettingRepository;

    // UC-08 purchase flow repositories.
    @MockBean
    private com.manabihub.order.repository.OrderRepository orderRepository;

    @MockBean
    private com.manabihub.order.repository.OrderItemRepository orderItemRepository;

    @MockBean
    private com.manabihub.payment.repository.PaymentTransactionRepository paymentTransactionRepository;

    @MockBean
    private com.manabihub.wallet.repository.WalletRepository walletRepository;

    @MockBean
    private com.manabihub.wallet.repository.WalletTransactionRepository walletTransactionRepository;

    @MockBean
    private com.manabihub.wallet.repository.EscrowLedgerRepository escrowLedgerRepository;

    @MockBean
    private TransactionTemplate transactionTemplate;

    @MockBean
    private com.manabihub.wallet.repository.TeacherWalletRepository teacherWalletRepository;

    @MockBean
    private com.manabihub.payout.repository.WithdrawalRequestRepository withdrawalRequestRepository;

    @MockBean
    private com.manabihub.payout.repository.PayoutSettlementRepository payoutSettlementRepository;

    @MockBean
    private com.manabihub.payout.repository.PayoutReconciliationLogRepository payoutReconciliationLogRepository;

    @MockBean
    private com.manabihub.payout.repository.TeacherBankAccountRepository teacherBankAccountRepository;

    @MockBean
    private com.manabihub.payout.repository.WithdrawalOtpChallengeRepository withdrawalOtpChallengeRepository;

    @Test
    void contextLoads() {
        // Basic integration test to verify the Spring Application Context loads correctly.
    }
}
