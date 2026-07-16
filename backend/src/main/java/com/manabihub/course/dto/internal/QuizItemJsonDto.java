package com.manabihub.course.dto.internal;

import lombok.Data;
import java.util.List;

@Data
public class QuizItemJsonDto {
    private String id;
    private String content;
    private boolean required;
    private String explanation;
    private List<Option> options;

    @Data
    public static class Option {
        private String id;
        private String content;
        private boolean isCorrect;
    }
}
