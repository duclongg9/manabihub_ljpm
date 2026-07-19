package com.manabihub.writing.service.impl;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.course.entity.Course;
import com.manabihub.course.entity.LessonBlock;
import com.manabihub.course.enums.LessonBlockType;
import com.manabihub.course.repository.LessonBlockRepository;
import com.manabihub.identity.service.CurrentUserService;
import com.manabihub.identity.entity.StudentProfile;
import com.manabihub.identity.repository.StudentProfileRepository;
import com.manabihub.learning.entity.Enrollment;
import com.manabihub.learning.enums.EnrollmentStatus;
import com.manabihub.learning.repository.EnrollmentRepository;
import com.manabihub.writing.dto.request.SubmitWritingRequest;
import com.manabihub.writing.dto.response.WritingAssignmentResponse;
import com.manabihub.writing.dto.response.WritingResultResponse;
import com.manabihub.writing.dto.response.WritingSubmissionResponse;
import com.manabihub.writing.entity.WritingSubmission;
import com.manabihub.writing.enums.WritingSubmissionStatus;
import com.manabihub.writing.repository.WritingSubmissionRepository;
import com.manabihub.writing.service.WritingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class WritingServiceImpl implements WritingService {

    private final LessonBlockRepository lessonBlockRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final WritingSubmissionRepository writingSubmissionRepository;
    private final CurrentUserService currentUserService;

    @Override
    @Transactional(readOnly = true)
    public WritingAssignmentResponse getAssignment(UUID lessonBlockId) {

        LessonBlock lessonBlock = resolveWritingLessonBlock(lessonBlockId);

        return WritingAssignmentResponse.builder()
                .lessonBlockId(lessonBlock.getId())
                .title(lessonBlock.getTitle())
                .prompt(lessonBlock.getWritingPrompt())
                .rubric(lessonBlock.getRubric())
                .build();
    }
    private LessonBlock resolveWritingLessonBlock(UUID lessonBlockId) {

        LessonBlock lessonBlock = lessonBlockRepository.findById(lessonBlockId)
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.MSG_WRITE_001,
                        "Không tìm thấy bài tập viết.",
                        HttpStatus.NOT_FOUND
                ));

        if (lessonBlock.getType() != LessonBlockType.WRITING) {
            throw new BusinessException(
                    MessageCodes.MSG_WRITE_003,
                    "Lesson block không phải dạng Writing.",
                    HttpStatus.BAD_REQUEST
            );
        }

        return lessonBlock;
    }

    private StudentProfile resolveStudent(UUID userId) {

        return studentProfileRepository.findByUser_Id(userId)
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.MSG_WRITE_004,
                        "Không tìm thấy hồ sơ học viên.",
                        HttpStatus.NOT_FOUND
                ));
    }

    private Enrollment resolveEnrollment(UUID userId, Course course) {

        return enrollmentRepository
                .findByStudent_User_IdAndCourse_IdAndStatus(
                        userId,
                        course.getId(),
                        EnrollmentStatus.ACTIVE
                )
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.MSG_WRITE_002,
                        "Bạn chưa ghi danh khóa học.",
                        HttpStatus.FORBIDDEN
                ));
    }

    private WritingSubmissionResponse toSubmissionResponse(
            WritingSubmission submission
    ) {

        return WritingSubmissionResponse.builder()
                .id(submission.getId())
                .lessonBlockId(submission.getLessonBlockId())
                .content(submission.getContent())
                .status(submission.getStatus())
                .submittedAt(submission.getSubmittedAt())
                .build();
    }

    @Override
    public WritingResultResponse submit(SubmitWritingRequest request) {

        UUID currentUserId = currentUserService.getCurrentUserId();

        StudentProfile student = resolveStudent(currentUserId);

        LessonBlock lessonBlock = resolveWritingLessonBlock(request.getLessonBlockId());

        Course course = lessonBlock.getModule().getCourse();

        Enrollment enrollment = resolveEnrollment(currentUserId, course);

        String content = request.getContent().trim();

        if (content.isBlank()) {
            throw new BusinessException(
                    MessageCodes.MSG_WRITE_005,
                    "Nội dung bài viết không được để trống.",
                    HttpStatus.BAD_REQUEST
            );
        }

        WritingSubmission submission = WritingSubmission.builder()
                .enrollment(enrollment)
                .student(student)
                .lessonBlockId(lessonBlock.getId())
                .legacyLessonId(null)
                .content(content)
                .status(WritingSubmissionStatus.SUBMITTED)
                .submittedAt(Instant.now())
                .build();

        WritingSubmission savedSubmission =
                writingSubmissionRepository.save(submission);

        return WritingResultResponse.builder()
                .submission(toSubmissionResponse(savedSubmission))
                .suggestion(null)
                .build();
    }
}

