package com.manabihub.writing.service.impl;

import com.manabihub.ai.entity.AiWritingSuggestion;
import com.manabihub.ai.service.AiWritingService;
import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.course.entity.LessonBlock;
import com.manabihub.course.enums.LessonBlockType;
import com.manabihub.course.repository.LessonBlockRepository;
import com.manabihub.identity.entity.StudentProfile;
import com.manabihub.identity.repository.StudentProfileRepository;
import com.manabihub.identity.service.CurrentUserService;
import com.manabihub.learning.entity.CourseEnrollment;
import com.manabihub.learning.enums.EnrollmentStatus;
import com.manabihub.learning.repository.CourseEnrollmentRepository;
import com.manabihub.writing.dto.request.SubmitWritingRequest;
import com.manabihub.writing.dto.response.WritingResultResponse;
import com.manabihub.writing.entity.WritingSubmission;
import com.manabihub.writing.enums.WritingSubmissionStatus;
import com.manabihub.writing.mapper.WritingMapper;
import com.manabihub.writing.repository.WritingSubmissionRepository;
import com.manabihub.writing.service.WritingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class WritingServiceImpl implements WritingService {

    private final CurrentUserService currentUserService;

    private final StudentProfileRepository studentProfileRepository;

    private final LessonBlockRepository lessonBlockRepository;

    private final CourseEnrollmentRepository enrollmentRepository;

    private final WritingSubmissionRepository writingSubmissionRepository;

    private final AiWritingService aiWritingService;

    private final WritingMapper mapper;

    @Override
    public WritingResultResponse submitWriting(SubmitWritingRequest request) {

        if (request.getContent() == null || request.getContent().isBlank()) {
            throw new BusinessException(
                    MessageCodes.MSG_WRITE_001,
                    "Writing content is too short."
            );
        }

        UUID userId = currentUserService.getCurrentUserId();

        StudentProfile student = studentProfileRepository.findByUser_Id(userId)
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.COMMON_NOT_FOUND,
                        "Student profile not found."
                ));

        LessonBlock lessonBlock = lessonBlockRepository.findById(request.getLessonBlockId())
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.COMMON_NOT_FOUND,
                        "Lesson block not found."
                ));

        if (lessonBlock.getType() != LessonBlockType.WRITING) {
            throw new BusinessException(
                    MessageCodes.LEARNING_INVALID_BLOCK_TYPE,
                    "This lesson block is not a writing lesson."
            );
        }

        UUID courseId = lessonBlock.getModule()
                .getCourse()
                .getId();

        CourseEnrollment enrollment = enrollmentRepository
                .findByStudent_IdAndCourse_IdAndStatus(
                        student.getId(),
                        courseId,
                        EnrollmentStatus.ACTIVE)
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.LEARNING_NOT_ENROLLED,
                        "You are not enrolled in this course."
                ));

        WritingSubmission submission = WritingSubmission.builder()
                .student(student)
                .enrollment(enrollment)
                .lessonBlock(lessonBlock)
                .content(request.getContent())
                .status(WritingSubmissionStatus.SUBMITTED)
                .submittedAt(Instant.now())
                .build();

        try {
            submission = writingSubmissionRepository.save(submission);

            AiWritingSuggestion suggestion =
                    aiWritingService.generateSuggestion(submission);

            return mapper.toResult(submission, suggestion);

        } catch (BusinessException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new BusinessException(
                    MessageCodes.MSG_WRITE_003,
                    "Unable to submit writing assignment.",
                    ex
            );
        }
    }
}