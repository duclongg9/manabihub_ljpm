package com.manabihub.course.repository;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase.Replace.NONE;

@DataJpaTest
@AutoConfigureTestDatabase(replace = NONE)
@Testcontainers
@ActiveProfiles("it")
public class CourseRepositoryIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine")
            .withDatabaseName("manabihub_test")
            .withUsername("testuser")
            .withPassword("testpass");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.flyway.enabled", () -> "true");
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "validate");
    }

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void hasFinalTestByCourseId_returnsFalse_whenQuizBlockExistsButNoFinalTest() {
        UUID userId = UUID.randomUUID();
        UUID teacherId = UUID.randomUUID();
        UUID courseId = UUID.randomUUID();
        UUID moduleId = UUID.randomUUID();
        UUID blockId = UUID.randomUUID();

        jdbcTemplate.update("INSERT INTO app_users (id, email, full_name, created_at, updated_at) VALUES (?, 't1@test.com', 'T1', now(), now())", userId);
        jdbcTemplate.update("INSERT INTO teacher_profiles (id, user_id, created_at, updated_at) VALUES (?, ?, now(), now())", teacherId, userId);
        jdbcTemplate.update("INSERT INTO courses (id, teacher_id, title, description, slug, status, created_at, updated_at) VALUES (?, ?, 'T', 'D', 'slug1', 'DRAFT', now(), now())", courseId, teacherId);
        jdbcTemplate.update("INSERT INTO course_modules (id, course_id, title, order_index, created_at, updated_at) VALUES (?, ?, 'M', 1, now(), now())", moduleId, courseId);
        jdbcTemplate.update("INSERT INTO course_lesson_blocks (id, module_id, title, block_type, order_index, created_at, updated_at) VALUES (?, ?, 'B', 'QUIZ', 1, now(), now())", blockId, moduleId);

        boolean result = courseRepository.hasFinalTestByCourseId(courseId);
        assertThat(result).isFalse();
    }

    @Test
    void hasFinalTestByCourseId_returnsTrue_whenFinalTestExists() {
        UUID userId = UUID.randomUUID();
        UUID teacherId = UUID.randomUUID();
        UUID courseId = UUID.randomUUID();

        jdbcTemplate.update("INSERT INTO app_users (id, email, full_name, created_at, updated_at) VALUES (?, 't2@test.com', 'T2', now(), now())", userId);
        jdbcTemplate.update("INSERT INTO teacher_profiles (id, user_id, created_at, updated_at) VALUES (?, ?, now(), now())", teacherId, userId);
        jdbcTemplate.update("INSERT INTO courses (id, teacher_id, title, description, slug, status, created_at, updated_at) VALUES (?, ?, 'T', 'D', 'slug2', 'DRAFT', now(), now())", courseId, teacherId);
        jdbcTemplate.update("INSERT INTO final_tests (id, course_id, time_limit_minutes, passing_score, max_retakes, jlpt_level, skill_focus, created_at, updated_at) VALUES (?, ?, 60, 50, 3, 'N3', 'READING', now(), now())", UUID.randomUUID(), courseId);

        boolean result = courseRepository.hasFinalTestByCourseId(courseId);
        assertThat(result).isTrue();
    }
}
