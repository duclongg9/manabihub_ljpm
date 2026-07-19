package com.manabihub.writing.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class SubmitWritingRequest {

    @NotNull(message = "Lesson block không được để trống.")
    private UUID lessonBlockId;

    @NotBlank(message = "Nội dung bài viết không được để trống.")
    private String content;
}