package com.manabihub.writing.service.impl;

import com.manabihub.ai.entity.AiWritingSuggestion;
import com.manabihub.ai.service.AiWritingService;
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
import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.writing.dto.response.WritingAssignmentResponse;

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

        if (request.getContent() == null
                || request.getContent().trim().length() < 100) {

            throw new BusinessException(
                    MessageCodes.MSG_WRITE_001,
                    "Nội dung bài viết phải có ít nhất 100 ký tự."
            );
        }

        UUID userId = currentUserService.getCurrentUserId();

        StudentProfile student = studentProfileRepository.findByUser_Id(userId)
                .orElseThrow(() ->
                        new BusinessException(
                                MessageCodes.MSG_COM_004,
                                "Không tìm thấy hồ sơ học viên."
                        ));

        LessonBlock lessonBlock = lessonBlockRepository.findById(request.getLessonBlockId())
                .orElseThrow(() ->
                        new BusinessException(
                                MessageCodes.MSG_COM_004,
                                "Không tìm thấy bài tập viết."
                        ));

        if (lessonBlock.getType() != LessonBlockType.WRITING) {
            throw new BusinessException(
                    MessageCodes.MSG_WRITE_003,
                    "Bài học không phải dạng luyện viết."
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
                .orElseThrow(() ->
                        new BusinessException(
                                MessageCodes.MSG_WRITE_003,
                                "Bạn chưa đăng ký khóa học này."
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

        } catch (Exception ex) {

            throw new BusinessException(
                    MessageCodes.MSG_WRITE_003,
                    "Gửi bài viết thất bại.",
                    ex
            );
        }
    }

    @Override
    @Transactional(readOnly = true)
    public WritingAssignmentResponse getWritingAssignment(UUID lessonBlockId) {

        LessonBlock lessonBlock = lessonBlockRepository.findById(lessonBlockId)
                .orElseThrow(() ->
                        new BusinessException(
                                MessageCodes.MSG_COM_004,
                                "Không tìm thấy bài tập viết."
                        ));

        if (lessonBlock.getType() != LessonBlockType.WRITING) {
            throw new BusinessException(
                    MessageCodes.MSG_WRITE_003,
                    "Bài học không phải dạng luyện viết."
            );
        }

        if (lessonBlock.getWritingPrompt() == null
                || lessonBlock.getWritingPrompt().isBlank()) {

            throw new BusinessException(
                    MessageCodes.MSG_COM_002,
                    "Đề bài luyện viết không được để trống."
            );
        }

        if (lessonBlock.getRubric() == null
                || lessonBlock.getRubric().isBlank()) {

            throw new BusinessException(
                    MessageCodes.MSG_WRITE_005,
                    "Thiếu tiêu chí chấm điểm bài viết."
            );
        }

        return WritingAssignmentResponse.builder()
                .lessonBlockId(lessonBlock.getId())
                .title(lessonBlock.getTitle())
                .prompt(lessonBlock.getWritingPrompt())
                .rubric(lessonBlock.getRubric())
                .minCharacters(100)
                .maxCharacters(500)
                .build();
    }
}