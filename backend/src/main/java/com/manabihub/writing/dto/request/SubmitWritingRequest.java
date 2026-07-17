package com.manabihub.writing.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

/**
 * Yêu cầu nộp bài viết.
 */
@Getter
@Setter
public class SubmitWritingRequest {

    /**
     * Nội dung bài viết.
     */
    @NotBlank(message = "MSG-WRITE-001")
    @Size(max = 10000, message = "MSG-WRITE-002")
    private String content;

    /**
     * Có yêu cầu AI gợi ý hay không.
     */
    private boolean requestAiSuggestion;
}