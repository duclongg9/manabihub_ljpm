package com.manabihub.course.repository;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@Testcontainers
@ActiveProfiles("it")
@Transactional
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
        UUID teacherId = UUID.randomUUID();
        UUID courseId = UUID.randomUUID();
        UUID moduleId = UUID.randomUUID();
        UUID blockId = UUID.randomUUID();

        jdbcTemplate.update("INSERT INTO app_users (id, email, password_hash) VALUES (?, 't1@test.com', 'hash')", teacherId);
        jdbcTemplate.update("INSERT INTO courses (id, teacher_id, title, description, slug, status, created_at, updated_at) VALUES (?, ?, 'T', 'D', 'slug1', 'DRAFT', now(), now())", courseId, teacherId);
        jdbcTemplate.update("INSERT INTO course_modules (id, course_id, title, created_at, updated_at) VALUES (?, ?, 'M', now(), now())", moduleId, courseId);
        jdbcTemplate.update("INSERT INTO course_lesson_blocks (id, module_id, title, block_type, created_at, updated_at) VALUES (?, ?, 'B', 'QUIZ', now(), now())", blockId, moduleId);

        boolean result = courseRepository.hasFinalTestByCourseId(courseId);
        assertThat(result).isFalse();
    }

    @Test
    void hasFinalTestByCourseId_returnsTrue_whenFinalTestExists() {
        UUID teacherId = UUID.randomUUID();
        UUID courseId = UUID.randomUUID();

        jdbcTemplate.update("INSERT INTO app_users (id, email, password_hash) VALUES (?, 't2@test.com', 'hash')", teacherId);
        jdbcTemplate.update("INSERT INTO courses (id, teacher_id, title, description, slug, status, created_at, updated_at) VALUES (?, ?, 'T', 'D', 'slug2', 'DRAFT', now(), now())", courseId, teacherId);
        jdbcTemplate.update("INSERT INTO final_tests (id, course_id, created_at, updated_at) VALUES (?, ?, now(), now())", UUID.randomUUID(), courseId);

        boolean result = courseRepository.hasFinalTestByCourseId(courseId);
        assertThat(result).isTrue();
    }
}
