package com.manabihub;

import com.manabihub.identity.mapper.StudentProfileMapper;
import com.manabihub.identity.mapper.TeacherProfileMapper;
import com.manabihub.identity.repository.IdentityTeacherProfileRepository;
import com.manabihub.identity.repository.StudentProfileRepository;
import com.manabihub.identity.repository.UserRepository;
import com.manabihub.identity.service.CurrentUserService;
import com.manabihub.kyc.service.TeacherKycService;
import com.manabihub.mock.repository.MockJlptRegistryRepository;
import com.manabihub.mock.repository.MockNationalIdRegistryRepository;
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
    private TeacherKycService teacherKycService;

    @MockBean
    private MockNationalIdRegistryRepository mockNationalIdRegistryRepository;

    @MockBean
    private MockJlptRegistryRepository mockJlptRegistryRepository;

    // ===== Student Profile =====

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private StudentProfileRepository studentProfileRepository;

    @MockBean
    private StudentProfileMapper studentProfileMapper;

    @MockBean
    private CurrentUserService currentUserService;

    // ===== Teacher Profile =====

    @MockBean
    private IdentityTeacherProfileRepository identityTeacherProfileRepository;

    @MockBean
    private TeacherProfileMapper teacherProfileMapper;

    @Test
    void contextLoads() {
        // Basic integration test to verify the Spring Application Context loads correctly
    }
}