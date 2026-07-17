package com.manabihub.writing.service.impl;

import com.manabihub.ai.dto.response.AiWritingSuggestionResponse;
import com.manabihub.ai.entity.AiWritingSuggestion;
import com.manabihub.ai.enums.SuggestionStatus;
import com.manabihub.ai.repository.AiWritingSuggestionRepository;
import com.manabihub.audit.service.AuditLogService;
import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.course.entity.LessonBlock;
import com.manabihub.identity.entity.StudentProfile;
import com.manabihub.identity.repository.StudentProfileRepository;
import com.manabihub.identity.service.CurrentUserService;
import com.manabihub.course.repository.LessonBlockRepository;
import com.manabihub.learning.entity.CourseEnrollment;
import com.manabihub.learning.enums.EnrollmentStatus;
import com.manabihub.learning.repository.CourseEnrollmentRepository;
import com.manabihub.notification.service.NotificationService;
import com.manabihub.writing.dto.request.SubmitWritingRequest;
import com.manabihub.writing.dto.response.WritingAssignmentResponse;
import com.manabihub.writing.dto.response.WritingSubmissionResponse;
import com.manabihub.writing.entity.WritingSubmission;
import com.manabihub.writing.enums.WritingSubmissionStatus;
import com.manabihub.writing.repository.WritingSubmissionRepository;
import com.manabihub.writing.service.WritingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.HashMap;

@Service
@RequiredArgsConstructor
@Transactional
public class WritingServiceImpl implements WritingService {

    private final LessonBlockRepository lessonBlockRepository;
    private final WritingSubmissionRepository writingSubmissionRepository;
    private final AiWritingSuggestionRepository aiWritingSuggestionRepository;
    private final CourseEnrollmentRepository enrollmentRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final CurrentUserService currentUserService;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    @Override
    @Transactional(readOnly = true)
    public WritingAssignmentResponse getAssignment(UUID lessonBlockId) {

        LessonBlock lessonBlock = getWritingLessonBlock(lessonBlockId);

        UUID userId = currentUserService.getCurrentUserId();

        StudentProfile student = studentProfileRepository
                .findByUser_Id(userId)
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.AUTH_UNAUTHORIZED,
                        "Student profile not found",
                        HttpStatus.UNAUTHORIZED));

        boolean enrolled = enrollmentRepository
                .findByStudent_IdAndCourse_IdAndStatus(
                        student.getId(),
                        lessonBlock.getModule().getCourse().getId(),
                        EnrollmentStatus.ACTIVE)
                .isPresent();

        if (!enrolled) {
            throw new BusinessException(
                    MessageCodes.LEARNING_NOT_ENROLLED,
                    "You are not enrolled in this course");
        };

        return WritingAssignmentResponse.builder()
                .lessonBlockId(lessonBlock.getId())
                .title(lessonBlock.getTitle())
                .prompt(lessonBlock.getWritingPrompt())
                .rubric(lessonBlock.getRubric())
                .minCharacters(50)
                .maxCharacters(10000)
                .build();
    }

    @Override
    @Transactional
    public WritingSubmissionResponse submitWriting(
            UUID lessonBlockId,
            SubmitWritingRequest request) {

        LessonBlock lessonBlock = getWritingLessonBlock(lessonBlockId);

        UUID userId = currentUserService.getCurrentUserId();

        StudentProfile student = studentProfileRepository
                .findByUser_Id(userId)
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.AUTH_UNAUTHORIZED,
                        "Student profile not found",
                        HttpStatus.UNAUTHORIZED));

        CourseEnrollment enrollment = enrollmentRepository
                .findByStudent_IdAndCourse_IdAndStatus(
                        student.getId(),
                        lessonBlock.getModule().getCourse().getId(),
                        EnrollmentStatus.ACTIVE)
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.LEARNING_NOT_ENROLLED,
                        "You are not enrolled in this course"));

        // Luôn tạo submission mới
        WritingSubmission submission = WritingSubmission.builder()
                .lessonBlock(lessonBlock)
                .student(student)
                .enrollment(enrollment)
                .content(request.getContent())
                .status(request.isRequestAiSuggestion()
                        ? WritingSubmissionStatus.SUGGESTION_PROCESSING
                        : WritingSubmissionStatus.SUBMITTED)
                .build();

        submission = writingSubmissionRepository.save(submission);

        // Mock AI
        if (request.isRequestAiSuggestion()) {

            createMockSuggestion(submission);

            submission.setStatus(WritingSubmissionStatus.SUGGESTION_READY);

            submission = writingSubmissionRepository.save(submission);
        }

    /*
    TODO:
    notificationService.createNotification(
            userId,
            student.getUser().getEmail(),
            "Writing submitted",
            "Your writing submission has been received.",
            "WRITING");
    */

        Map<String, Object> afterValue = new HashMap<>();
        afterValue.put("status", submission.getStatus().name());
        afterValue.put("lessonBlockId", lessonBlockId.toString());

        auditLogService.logUserAction(
                userId,
                "STUDENT",
                "SUBMIT_WRITING",
                "WRITING_SUBMISSION",
                submission.getId(),
                null,
                afterValue,
                null
        );

        return toResponse(submission);
    }

    @Override
    @Transactional(readOnly = true)
    public WritingSubmissionResponse getSubmission(UUID submissionId) {

        UUID userId = currentUserService.getCurrentUserId();

        StudentProfile student = studentProfileRepository
                .findByUser_Id(userId)
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.AUTH_UNAUTHORIZED,
                        "Student profile not found",
                        HttpStatus.UNAUTHORIZED));

        WritingSubmission submission =
                writingSubmissionRepository
                        .findByIdAndStudent_Id(
                                submissionId,
                                student.getId())
                        .orElseThrow(() ->
                                new BusinessException(
                                        MessageCodes.COMMON_NOT_FOUND,
                                        "Writing submission not found"));

        return toResponse(submission);
    }

    private LessonBlock getWritingLessonBlock(UUID lessonBlockId) {

        LessonBlock lessonBlock =
                lessonBlockRepository.findById(lessonBlockId)
                        .orElseThrow(() ->
                                new BusinessException(
                                        MessageCodes.COMMON_NOT_FOUND,
                                        "Lesson block not found"));

        if (!lessonBlock.isWritingBlock()) {
            throw new BusinessException(
                    MessageCodes.LEARNING_INVALID_BLOCK_TYPE,
                    "Lesson block is not writing");
        }

        return lessonBlock;
    }

    private AiWritingSuggestion createMockSuggestion(
            WritingSubmission submission) {

        AiWritingSuggestion suggestion =
                AiWritingSuggestion.builder()
                        .writingSubmission(submission)
                        .provider("MOCK")
                        .suggestionStatus(SuggestionStatus.READY)
                        .grammarSuggestions("[]")
                        .vocabularySuggestions("[]")
                        .structureSuggestions("[]")
                        .revisionGuidance("AI model is not available.")
                        .confidenceLevel("LOW")
                        .official(false)
                        .rawResponse("{}")
                        .build();

        return aiWritingSuggestionRepository.save(suggestion);
    }

    private WritingSubmissionResponse toResponse(
            WritingSubmission submission) {

        Optional<AiWritingSuggestion> suggestion =
                aiWritingSuggestionRepository
                        .findByWritingSubmission_Id(submission.getId());

        AiWritingSuggestionResponse aiResponse =
                suggestion.map(ai -> AiWritingSuggestionResponse.builder()
                                .id(ai.getId())
                                .provider(ai.getProvider())
                                .grammarSuggestions(ai.getGrammarSuggestions())
                                .vocabularySuggestions(ai.getVocabularySuggestions())
                                .structureSuggestions(ai.getStructureSuggestions())
                                .revisionGuidance(ai.getRevisionGuidance())
                                .confidenceLevel(ai.getConfidenceLevel())
                                .createdAt(ai.getCreatedAt())
                                .build())
                        .orElse(null);

        return WritingSubmissionResponse.builder()
                .id(submission.getId())
                .lessonBlockId(
                        submission.getLessonBlock().getId())
                .status(submission.getStatus())
                .content(submission.getContent())
                .submittedAt(submission.getSubmittedAt())
                .aiSuggestion(aiResponse)
                .build();
    }

}