package com.manabihub.writing.service.impl;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.common.response.PageResponse;
import com.manabihub.identity.service.CurrentUserService;
import com.manabihub.kyc.domain.TeacherProfile;
import com.manabihub.kyc.repository.TeacherProfileRepository;
import com.manabihub.notification.service.NotificationService;
import com.manabihub.writing.dto.request.TeacherWritingFeedbackRequest;
import com.manabihub.writing.dto.response.AiWritingSuggestionResponse;
import com.manabihub.writing.dto.response.TeacherWritingFeedbackResponse;
import com.manabihub.writing.dto.response.WritingSubmissionDetailResponse;
import com.manabihub.writing.dto.response.WritingSubmissionSummaryResponse;
import com.manabihub.writing.entity.AiWritingSuggestion;
import com.manabihub.writing.entity.TeacherWritingFeedback;
import com.manabihub.writing.entity.WritingSubmission;
import com.manabihub.writing.enums.WritingSubmissionStatus;
import com.manabihub.writing.repository.AiWritingSuggestionRepository;
import com.manabihub.writing.repository.TeacherWritingFeedbackRepository;
import com.manabihub.writing.repository.WritingSubmissionRepository;
import com.manabihub.writing.repository.projection.WritingSubmissionQueueProjection;
import com.manabihub.writing.service.TeacherWritingReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TeacherWritingReviewServiceImpl implements TeacherWritingReviewService {

    private final CurrentUserService currentUserService;
    private final TeacherProfileRepository teacherProfileRepository;
    private final WritingSubmissionRepository writingSubmissionRepository;
    private final AiWritingSuggestionRepository aiWritingSuggestionRepository;
    private final TeacherWritingFeedbackRepository teacherWritingFeedbackRepository;
    private final NotificationService notificationService;

    @Override
    public PageResponse<WritingSubmissionSummaryResponse> listSubmissions(
            String searchQuery,
            Boolean reviewed,
            Pageable pageable
    ) {
        TeacherProfile teacher = getCurrentTeacher();
        String normalizedQuery = searchQuery == null ? "" : searchQuery.trim();

        Page<WritingSubmissionSummaryResponse> responsePage = writingSubmissionRepository
                .findOwnedQueue(teacher.getId(), normalizedQuery, reviewed, pageable)
                .map(this::toSummaryResponse);

        return PageResponse.from(responsePage);
    }

    @Override
    public WritingSubmissionDetailResponse getSubmission(UUID submissionId) {
        TeacherProfile teacher = getCurrentTeacher();
        WritingSubmission submission = findOwnedSubmission(submissionId, teacher.getId(), false);
        return toDetailResponse(submission);
    }

    @Override
    @Transactional
    public WritingSubmissionDetailResponse saveFeedback(
            UUID submissionId,
            TeacherWritingFeedbackRequest request
    ) {
        TeacherProfile teacher = getCurrentTeacher();
        WritingSubmission submission = findOwnedSubmission(submissionId, teacher.getId(), true);

        TeacherWritingFeedback feedback = teacherWritingFeedbackRepository
                .findFirstByWritingSubmission_IdOrderByCreatedAtDesc(submissionId)
                .orElseGet(() -> TeacherWritingFeedback.builder()
                        .writingSubmission(submission)
                        .teacher(teacher)
                        .official(true)
                        .build());

        feedback.setScore(request.score());
        feedback.setComment(request.comment().trim());
        feedback.setTeacher(teacher);
        teacherWritingFeedbackRepository.save(feedback);

        submission.setStatus(WritingSubmissionStatus.TEACHER_FEEDBACK_READY);
        writingSubmissionRepository.save(submission);

        notificationService.createNotification(
                submission.getStudent().getUser().getId(),
                null,
                "Writing feedback is ready",
                "Your teacher has reviewed your writing submission for "
                        + submission.getEnrollment().getCourse().getTitle() + ".",
                "TEACHER_WRITING_FEEDBACK"
        );

        return toDetailResponse(submission);
    }

    private TeacherProfile getCurrentTeacher() {
        UUID userId = currentUserService.getCurrentUserId();
        return teacherProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.AUTH_FORBIDDEN,
                        "Teacher profile is required",
                        HttpStatus.FORBIDDEN
                ));
    }

    private WritingSubmission findOwnedSubmission(
            UUID submissionId,
            UUID teacherId,
            boolean forUpdate
    ) {
        return (forUpdate
                ? writingSubmissionRepository.findOwnedByIdForUpdate(submissionId, teacherId)
                : writingSubmissionRepository.findOwnedById(submissionId, teacherId))
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.WRITING_SUBMISSION_NOT_FOUND,
                        "Writing submission was not found",
                        HttpStatus.NOT_FOUND
                ));
    }

    private WritingSubmissionSummaryResponse toSummaryResponse(
            WritingSubmissionQueueProjection projection
    ) {
        return new WritingSubmissionSummaryResponse(
                projection.getId(),
                projection.getCourseId(),
                projection.getCourseTitle(),
                projection.getLessonTitle(),
                projection.getStudentName(),
                projection.getStudentEmail(),
                WritingSubmissionStatus.valueOf(projection.getStatus()),
                projection.getSubmittedAt(),
                projection.getHasAiSuggestion(),
                projection.getHasTeacherFeedback()
        );
    }

    private WritingSubmissionDetailResponse toDetailResponse(WritingSubmission submission) {
        AiWritingSuggestionResponse aiSuggestion = aiWritingSuggestionRepository
                .findFirstByWritingSubmission_IdOrderByCreatedAtDesc(submission.getId())
                .map(this::toAiResponse)
                .orElse(null);

        TeacherWritingFeedbackResponse teacherFeedback = teacherWritingFeedbackRepository
                .findFirstByWritingSubmission_IdOrderByCreatedAtDesc(submission.getId())
                .map(this::toFeedbackResponse)
                .orElse(null);

        return new WritingSubmissionDetailResponse(
                submission.getId(),
                submission.getEnrollment().getCourse().getId(),
                submission.getEnrollment().getCourse().getTitle(),
                writingSubmissionRepository.findLessonTitle(submission.getId())
                        .orElse("Writing activity"),
                resolveStudentName(submission),
                submission.getStudent().getUser().getEmail(),
                submission.getContent(),
                submission.getStatus(),
                submission.getSubmittedAt(),
                aiSuggestion,
                teacherFeedback
        );
    }

    private String resolveStudentName(WritingSubmission submission) {
        String displayName = submission.getStudent().getDisplayName();
        if (displayName != null && !displayName.isBlank()) {
            return displayName;
        }
        return submission.getStudent().getUser().getFullName();
    }

    private AiWritingSuggestionResponse toAiResponse(AiWritingSuggestion suggestion) {
        return new AiWritingSuggestionResponse(
                suggestion.getId(),
                suggestion.getStatus(),
                suggestion.getGrammarSuggestions(),
                suggestion.getVocabularySuggestions(),
                suggestion.getStructureSuggestions(),
                suggestion.getRevisionGuidance(),
                suggestion.getConfidenceLevel(),
                suggestion.isOfficial(),
                suggestion.getFailureReason(),
                suggestion.getCreatedAt()
        );
    }

    private TeacherWritingFeedbackResponse toFeedbackResponse(TeacherWritingFeedback feedback) {
        return new TeacherWritingFeedbackResponse(
                feedback.getId(),
                feedback.getScore(),
                feedback.getComment(),
                feedback.getRubricResult(),
                feedback.isOfficial(),
                feedback.getCreatedAt(),
                feedback.getUpdatedAt()
        );
    }
}
