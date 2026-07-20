package com.manabihub.learning.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.course.dto.response.FlashcardItemResponse;
import com.manabihub.course.entity.LessonBlock;
import com.manabihub.course.repository.LessonBlockRepository;
import com.manabihub.identity.entity.StudentProfile;
import com.manabihub.identity.repository.StudentProfileRepository;
import com.manabihub.identity.service.CurrentUserService;
import com.manabihub.learning.dto.request.ReviewFlashcardRequest;
import com.manabihub.learning.dto.response.FlashcardResponse;
import com.manabihub.learning.dto.response.FlashcardSummaryResponse;
import com.manabihub.learning.entity.Enrollment;
import com.manabihub.learning.entity.FlashcardProgress;
import com.manabihub.learning.enums.EnrollmentStatus;
import com.manabihub.learning.repository.EnrollmentRepository;
import com.manabihub.learning.repository.FlashcardProgressRepository;
import com.manabihub.learning.service.FlashcardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class FlashcardServiceImpl implements FlashcardService {

    private static final TypeReference<List<FlashcardItemResponse>> FLASHCARD_TYPE =
            new TypeReference<>() {};

    private final FlashcardProgressRepository flashcardProgressRepository;
    private final LessonBlockRepository lessonBlockRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final CurrentUserService currentUserService;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(readOnly = true)
    public FlashcardResponse getFlashcards(UUID lessonBlockId) {

        StudentProfile student = getCurrentStudent();

        LessonBlock lessonBlock = getLessonBlock(lessonBlockId);

        validateEnrollment(student, lessonBlock);

        return new FlashcardResponse(
                lessonBlock.getId(),
                lessonBlock.getTitle(),
                readFlashcards(lessonBlock)
        );
    }

    @Override
    public void reviewFlashcard(ReviewFlashcardRequest request) {

        StudentProfile student = getCurrentStudent();

        LessonBlock lessonBlock = getLessonBlock(request.lessonBlockId());

        Enrollment enrollment = validateEnrollment(student, lessonBlock);

        List<FlashcardItemResponse> flashcards = readFlashcards(lessonBlock);

        if (request.cardIndex() < 0 || request.cardIndex() >= flashcards.size()) {
            throw new BusinessException(
                    MessageCodes.MSG_FLASH_004,
                    "Thẻ ghi nhớ không hợp lệ.",
                    HttpStatus.BAD_REQUEST
            );
        }

        FlashcardProgress progress =
                flashcardProgressRepository
                        .findByEnrollmentAndLessonBlockAndCardIndex(
                                enrollment,
                                lessonBlock,
                                request.cardIndex()
                        )
                        .orElseGet(() -> FlashcardProgress.builder()
                                .enrollment(enrollment)
                                .lessonBlock(lessonBlock)
                                .cardIndex(request.cardIndex())
                                .build());

        progress.setStatus(request.status());

        try {

            flashcardProgressRepository.save(progress);

        } catch (Exception e) {

            throw new BusinessException(
                    MessageCodes.MSG_FLASH_005,
                    "Không thể lưu kết quả ôn tập. Vui lòng thử lại.",
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    e
            );
        }
    }

    private StudentProfile getCurrentStudent() {

        UUID userId = currentUserService.getCurrentUserId();

        return studentProfileRepository.findByUser_Id(userId)
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.MSG_PRO_001,
                        "Không tìm thấy hồ sơ học viên.",
                        HttpStatus.NOT_FOUND
                ));
    }

    private LessonBlock getLessonBlock(UUID lessonBlockId) {

        return lessonBlockRepository.findById(lessonBlockId)
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.MSG_FLASH_001,
                        "Không tìm thấy khối thẻ ghi nhớ.",
                        HttpStatus.NOT_FOUND
                ));
    }

    private Enrollment validateEnrollment(
            StudentProfile student,
            LessonBlock lessonBlock
    ) {

        UUID courseId = lessonBlock.getModule()
                .getCourse()
                .getId();

        return enrollmentRepository
                .findByStudentIdAndCourseIdAndStatus(
                        student.getId(),
                        courseId,
                        EnrollmentStatus.ACTIVE
                )
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.MSG_FLASH_002,
                        "Bạn chưa đăng ký khóa học này.",
                        HttpStatus.FORBIDDEN
                ));
    }

    private List<FlashcardItemResponse> readFlashcards(
            LessonBlock lessonBlock
    ) {

        if (!StringUtils.hasText(lessonBlock.getFlashcardsJson())) {
            return List.of();
        }

        try {

            return objectMapper.readValue(
                    lessonBlock.getFlashcardsJson(),
                    FLASHCARD_TYPE
            );

        } catch (JsonProcessingException e) {

            throw new BusinessException(
                    MessageCodes.MSG_FLASH_003,
                    "Không thể tải dữ liệu thẻ ghi nhớ.",
                    e
            );
        }
    }
    @Override
    @Transactional(readOnly = true)
    public FlashcardSummaryResponse getSummary(UUID lessonBlockId) {

        StudentProfile student = getCurrentStudent();

        LessonBlock lessonBlock = getLessonBlock(lessonBlockId);

        Enrollment enrollment = validateEnrollment(student, lessonBlock);

        List<FlashcardItemResponse> flashcards = readFlashcards(lessonBlock);

        List<FlashcardProgress> progresses =
                flashcardProgressRepository.findByEnrollmentAndLessonBlock(
                        enrollment,
                        lessonBlock
                );

        long remembered = progresses.stream()
                .filter(progress ->
                        progress.getStatus() ==
                                com.manabihub.learning.enums.FlashcardReviewStatus.REMEMBERED
                )
                .count();

        long needReview = progresses.stream()
                .filter(progress ->
                        progress.getStatus() ==
                                com.manabihub.learning.enums.FlashcardReviewStatus.NEED_REVIEW
                )
                .count();

        long skipped = progresses.stream()
                .filter(progress ->
                        progress.getStatus() ==
                                com.manabihub.learning.enums.FlashcardReviewStatus.SKIPPED
                )
                .count();

        return new FlashcardSummaryResponse(
                flashcards.size(),
                remembered,
                needReview,
                skipped
        );
    }

}