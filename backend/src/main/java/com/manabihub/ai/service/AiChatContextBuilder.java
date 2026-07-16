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
        String blockContent = firstNonBlank(
                lessonBlock.getContent(),
                lessonBlock.getWritingPrompt(),
                "No text content is available for this lesson block."
        );

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

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (StringUtils.hasText(value)) {
                return value;
            }
        }
        return "";
    }

    private String truncate(String value, int maxLength) {
        if (!StringUtils.hasText(value)) {
            return "";
        }
        return value.length() <= maxLength ? value : value.substring(0, maxLength);
    }
}
