package com.manabihub.writing.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class SubmitWritingRequest {

    @NotNull
    private UUID lessonBlockId;

    @NotBlank
    private String content;
}