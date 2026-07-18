package com.manabihub.ai.service;

import com.manabihub.ai.domain.AiChatContext;
import com.manabihub.course.entity.Course;
import com.manabihub.course.entity.CourseModule;
import com.manabihub.course.entity.LessonBlock;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AiChatContextBuilderTest {

    private final AiChatContextBuilder contextBuilder = new AiChatContextBuilder();

    @Test
    void build_UsesOnlyCurrentLessonBlockAndCourseMetadata() {
        Course course = Course.builder()
                .id(UUID.randomUUID())
                .title("N5 Grammar")
                .description("Course metadata")
                .outcomes("Learn particles")
                .build();
        CourseModule module = CourseModule.builder()
                .id(UUID.randomUUID())
                .course(course)
                .title("Lesson one")
                .orderIndex(1)
                .build();
        LessonBlock currentBlock = LessonBlock.builder()
                .id(UUID.randomUUID())
                .module(module)
                .title("Topic marker")
                .content("Use wa for the topic.")
                .orderIndex(1)
                .build();
        LessonBlock unrelatedBlock = LessonBlock.builder()
                .id(UUID.randomUUID())
                .module(module)
                .title("Unrelated")
                .content("UNRELATED_BLOCK_CONTENT")
                .orderIndex(2)
                .build();
        module.addBlock(currentBlock);
        module.addBlock(unrelatedBlock);

        AiChatContext context = contextBuilder.build(course, currentBlock);

        assertEquals(currentBlock.getId(), context.lessonBlockId());
        assertEquals("Lesson text:\nUse wa for the topic.", context.lessonContent());
        assertFalse(context.lessonContent().contains("UNRELATED_BLOCK_CONTENT"));
    }

    @Test
    void build_UsesStructuredBlockContentWithoutExposingQuizAnswer() {
        Course course = Course.builder()
                .id(UUID.randomUUID())
                .title("N5 Review")
                .build();
        CourseModule module = CourseModule.builder()
                .id(UUID.randomUUID())
                .course(course)
                .title("Review")
                .orderIndex(1)
                .build();
        LessonBlock quizBlock = LessonBlock.builder()
                .id(UUID.randomUUID())
                .module(module)
                .title("Particle quiz")
                .quizQuestion("Choose the topic marker")
                .quizOptionsJson("[\"wa\",\"o\"]")
                .quizAnswer("SECRET_CORRECT_ANSWER")
                .orderIndex(1)
                .build();

        AiChatContext context = contextBuilder.build(course, quizBlock);

        assertTrue(context.lessonContent().contains("Choose the topic marker"));
        assertTrue(context.lessonContent().contains("[\"wa\",\"o\"]"));
        assertFalse(context.lessonContent().contains("SECRET_CORRECT_ANSWER"));
    }
}
