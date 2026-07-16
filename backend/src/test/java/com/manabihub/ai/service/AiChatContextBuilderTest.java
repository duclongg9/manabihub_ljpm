package com.manabihub.ai.service;

import com.manabihub.ai.domain.AiChatContext;
import com.manabihub.course.entity.Course;
import com.manabihub.course.entity.CourseModule;
import com.manabihub.course.entity.LessonBlock;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

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
        assertEquals("Use wa for the topic.", context.lessonContent());
        assertFalse(context.lessonContent().contains("UNRELATED_BLOCK_CONTENT"));
    }
}
