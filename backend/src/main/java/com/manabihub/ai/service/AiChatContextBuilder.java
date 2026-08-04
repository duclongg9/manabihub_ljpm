package com.manabihub.ai.service;

import com.manabihub.ai.domain.AiChatContext;
import com.manabihub.course.entity.Course;
import com.manabihub.course.entity.LessonBlock;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class AiChatContextBuilder {

    private static final int MAX_CONTEXT_LENGTH = 12_000;

    public AiChatContext build(Course course, LessonBlock lessonBlock) {
        String blockContent = buildLessonContent(lessonBlock);

        return new AiChatContext(
                course.getId(),
                lessonBlock.getId(),
                course.getTitle(),
                truncate(course.getDescription(), 2_000),
                truncate(course.getOutcomes(), 2_000),
                lessonBlock.getTitle(),
                truncate(blockContent, MAX_CONTEXT_LENGTH)
        );
    }

    private String buildLessonContent(LessonBlock lessonBlock) {
        StringBuilder content = new StringBuilder();
        appendSection(content, "Lesson text", lessonBlock.getContent());
        appendSection(content, "Quiz question", lessonBlock.getQuizQuestion());
        appendSection(content, "Quiz options", lessonBlock.getQuizOptionsJson());
        appendSection(content, "Flashcards", lessonBlock.getFlashcardsJson());
        appendSection(content, "Writing prompt", lessonBlock.getWritingPrompt());
        appendSection(content, "Writing rubric", lessonBlock.getRubric());

        if (content.isEmpty()) {
            return "No text content is available for this lesson block.";
        }
        return content.toString();
    }

    private void appendSection(StringBuilder target, String label, String value) {
        if (!StringUtils.hasText(value)) {
            return;
        }
        if (!target.isEmpty()) {
            target.append("\n\n");
        }
        target.append(label).append(":\n").append(value.trim());
    }

    private String truncate(String value, int maxLength) {
        if (!StringUtils.hasText(value)) {
            return "";
        }
        return value.length() <= maxLength ? value : value.substring(0, maxLength);
    }
}
