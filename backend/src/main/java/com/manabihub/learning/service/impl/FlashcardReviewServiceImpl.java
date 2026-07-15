package com.manabihub.learning.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.course.dto.request.FlashcardItemRequest;
import com.manabihub.course.entity.LessonBlock;
import com.manabihub.course.enums.LessonBlockType;
import com.manabihub.course.repository.LessonBlockRepository;
import com.manabihub.identity.entity.StudentProfile;
import com.manabihub.identity.repository.StudentProfileRepository;
import com.manabihub.identity.service.CurrentUserService;
import com.manabihub.learning.dto.request.FlashcardReviewRequest;
import com.manabihub.learning.dto.response.FlashcardSummaryResponse;
import com.manabihub.learning.dto.response.LearningFlashcardResponse;
import com.manabihub.learning.entity.FlashcardReview;
import com.manabihub.learning.enums.FlashcardReviewStatus;
import com.manabihub.learning.repository.FlashcardReviewRepository;
import com.manabihub.learning.service.FlashcardReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class FlashcardReviewServiceImpl implements FlashcardReviewService {

    private final FlashcardReviewRepository flashcardReviewRepository;

    private final LessonBlockRepository lessonBlockRepository;

    private final StudentProfileRepository studentProfileRepository;

    private final CurrentUserService currentUserService;

    private final ObjectMapper objectMapper;

    @Override
    @Transactional(readOnly = true)
    public List<LearningFlashcardResponse> getFlashcards(UUID lessonBlockId) {

        StudentProfile student = getCurrentStudent();

        LessonBlock lessonBlock = getFlashcardBlock(lessonBlockId);

        List<FlashcardItemRequest> flashcards =
                parseFlashcards(lessonBlock.getFlashcardsJson());

        List<FlashcardReview> reviews =
                flashcardReviewRepository
                        .findByStudentAndLessonBlockOrderByCardIndexAsc(
                                student,
                                lessonBlock
                        );

        Map<Integer, FlashcardReviewStatus> reviewMap =
                reviews.stream()
                        .collect(Collectors.toMap(
                                FlashcardReview::getCardIndex,
                                FlashcardReview::getStatus
                        ));

        List<LearningFlashcardResponse> response = new ArrayList<>();

        for (int i = 0; i < flashcards.size(); i++) {

            FlashcardItemRequest item = flashcards.get(i);

            response.add(
                    LearningFlashcardResponse.builder()
                            .cardIndex(i)
                            .front(item.front())
                            .back(item.back())
                            .reviewStatus(reviewMap.get(i))
                            .build()
            );
        }

        return response;
    }
    @Override
    public void reviewFlashcard(FlashcardReviewRequest request) {

        StudentProfile student = getCurrentStudent();

        LessonBlock lessonBlock = getFlashcardBlock(request.getLessonBlockId());

        List<FlashcardItemRequest> flashcards =
                parseFlashcards(lessonBlock.getFlashcardsJson());

        if (request.getCardIndex() < 0
                || request.getCardIndex() >= flashcards.size()) {

            throw new BusinessException(
                    MessageCodes.MSG_FLASHCARD_002,
                    "Invalid flashcard index.",
                    HttpStatus.BAD_REQUEST
            );
        }

        FlashcardReview review = flashcardReviewRepository
                .findByStudentAndLessonBlockAndCardIndex(
                        student,
                        lessonBlock,
                        request.getCardIndex()
                )
                .orElse(
                        FlashcardReview.builder()
                                .student(student)
                                .lessonBlock(lessonBlock)
                                .cardIndex(request.getCardIndex())
                                .build()
                );

        review.setStatus(request.getStatus());

        flashcardReviewRepository.save(review);

    }

    @Override
    @Transactional(readOnly = true)
    public FlashcardSummaryResponse getSummary(UUID lessonBlockId) {

        StudentProfile student = getCurrentStudent();

        LessonBlock lessonBlock = getFlashcardBlock(lessonBlockId);

        List<FlashcardItemRequest> flashcards =
                parseFlashcards(lessonBlock.getFlashcardsJson());

        List<FlashcardReview> reviews =
                flashcardReviewRepository
                        .findByStudentAndLessonBlockOrderByCardIndexAsc(
                                student,
                                lessonBlock
                        );

        int remembered = 0;
        int needReview = 0;
        int skipped = 0;

        for (FlashcardReview review : reviews) {

            switch (review.getStatus()) {

                case REMEMBERED -> remembered++;

                case NEED_REVIEW -> needReview++;

                case SKIPPED -> skipped++;
            }

        }

        double completion = flashcards.isEmpty()
                ? 0
                : ((double) reviews.size() / flashcards.size()) * 100;

        return FlashcardSummaryResponse.builder()
                .totalCards(flashcards.size())
                .remembered(remembered)
                .needReview(needReview)
                .skipped(skipped)
                .completion(completion)
                .build();

    }
    private List<FlashcardItemRequest> parseFlashcards(String json) {

        if (!StringUtils.hasText(json)) {
            return List.of();
        }

        try {

            return objectMapper.readValue(
                    json,
                    new TypeReference<List<FlashcardItemRequest>>() {
                    }
            );

        } catch (Exception ex) {

            throw new BusinessException(
                    MessageCodes.COMMON_INTERNAL_ERROR,
                    "Cannot parse flashcards.",
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    ex
            );

        }

    }

    private StudentProfile getCurrentStudent() {

        UUID userId = currentUserService.getCurrentUserId();

        return studentProfileRepository.findByUser_Id(userId)
                .orElseThrow(() ->
                        new BusinessException(
                                MessageCodes.COMMON_NOT_FOUND,
                                "Student profile not found.",
                                HttpStatus.NOT_FOUND
                        )
                );

    }

    private LessonBlock getFlashcardBlock(UUID lessonBlockId) {

        LessonBlock lessonBlock = lessonBlockRepository.findById(lessonBlockId)
                .orElseThrow(() ->
                        new BusinessException(
                                MessageCodes.COMMON_NOT_FOUND,
                                "Lesson block not found.",
                                HttpStatus.NOT_FOUND
                        )
                );

        if (lessonBlock.getType() != LessonBlockType.FLASHCARD) {

            throw new BusinessException(
                    MessageCodes.MSG_FLASHCARD_002,
                    "This lesson block is not a flashcard block.",
                    HttpStatus.BAD_REQUEST
            );

        }

        return lessonBlock;

    }

}