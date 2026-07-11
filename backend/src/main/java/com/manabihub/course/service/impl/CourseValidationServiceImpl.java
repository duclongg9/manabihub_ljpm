package com.manabihub.course.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.manabihub.course.dto.response.ValidationError;
import com.manabihub.course.dto.response.ValidationResultResponse;
import com.manabihub.course.entity.Course;
import com.manabihub.course.entity.CourseLearningGoal;
import com.manabihub.course.entity.CourseModule;
import com.manabihub.course.entity.LessonBlock;
import com.manabihub.course.enums.LessonBlockType;
import com.manabihub.course.repository.CourseRepository;
import com.manabihub.course.service.CourseValidationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CourseValidationServiceImpl implements CourseValidationService {

    private final CourseRepository courseRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(readOnly = true)
    public ValidationResultResponse validateCourse(UUID courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new IllegalArgumentException("Course not found"));

        List<ValidationError> errors = new ArrayList<>();

        validateMetadata(course, errors);
        validateGoals(course, errors);
        
        // TODO: Distinguish between Video Course and Final Test products
        // For now, if there are modules, we validate them.
        validateHierarchy(course, errors);
        validateContentBlocks(course, errors);
        validateFinalTest(course, errors);

        return new ValidationResultResponse(errors.isEmpty(), errors);
    }

    private void validateMetadata(Course course, List<ValidationError> errors) {
        // BR-COURSE-04
        if (!StringUtils.hasText(course.getTitle()) || 
            course.getJlptLevel() == null ||
            !StringUtils.hasText(course.getIntroduction()) ||
            !StringUtils.hasText(course.getOutcomes()) ||
            !StringUtils.hasText(course.getThumbnailUrl()) ||
            !StringUtils.hasText(course.getCategory()) ||
            course.getPrice() == null) {
            
            errors.add(new ValidationError("MSG-COURSE-004", "Sản phẩm chưa đáp ứng điều kiện gửi duyệt.", "error"));
        }
        
        // BR-COURSE-05
        if (course.getPrice() != null && course.getPrice().doubleValue() < 0) {
            errors.add(new ValidationError("MSG-COURSE-003", "Giá sản phẩm không được thấp hơn mức tối thiểu của nền tảng.", "error"));
        }
    }

    private void validateGoals(Course course, List<ValidationError> errors) {
        // BR-GOAL-01
        List<CourseLearningGoal> goals = course.getLearningGoals();
        if (goals == null || goals.size() < 4) {
            errors.add(new ValidationError("MSG-GOAL-001", "Vui lòng nhập tối thiểu 4 mục tiêu học tập.", "error"));
        }
        
        // BR-GOAL-02
        if (goals != null) {
            for (CourseLearningGoal goal : goals) {
                if (!StringUtils.hasText(goal.getGoalText()) || goal.getGoalText().length() > 160) {
                    errors.add(new ValidationError("MSG-GOAL-002", "Mỗi mục tiêu học tập không được vượt quá 160 ký tự.", "error"));
                    break;
                }
            }
        }
        
        // BR-GOAL-03
        if (!StringUtils.hasText(course.getPrerequisites())) {
            errors.add(new ValidationError("MSG-GOAL-003", "Vui lòng nhập yêu cầu đầu vào hoặc chọn Không yêu cầu đầu vào.", "error"));
        }
        
        // BR-GOAL-04
        if (!StringUtils.hasText(course.getTargetStudents())) {
            errors.add(new ValidationError("MSG-GOAL-004", "Vui lòng mô tả đối tượng học viên phù hợp với sản phẩm này.", "error"));
        }
    }

    private void validateHierarchy(Course course, List<ValidationError> errors) {
        List<CourseModule> modules = course.getModules();
        if (modules == null || modules.isEmpty()) {
            return; // Skip if no modules (might be a Final Test product)
        }
        
        int totalLessons = 0;
        int totalVideoDuration = 0;
        
        for (CourseModule module : modules) {
            if (module.getBlocks() != null && !module.getBlocks().isEmpty()) {
                // Determine lessons logic: maybe any block is a lesson?
                // For simplicity, we count each block as a "lesson step", but the BR says "5 separate lessons".
                // In ManabiHub, usually Video blocks are lessons. We'll count all blocks for now.
                totalLessons += module.getBlocks().size();
                for (LessonBlock block : module.getBlocks()) {
                    if (block.getType() == LessonBlockType.VIDEO && block.getDurationMinutes() != null) {
                        totalVideoDuration += block.getDurationMinutes();
                    }
                }
            }
        }
        
        // BR-CRS-05
        if (totalLessons < 5) {
            errors.add(new ValidationError("MSG-COURSE-015", "Video Course cần có tối thiểu 5 bài học trước khi gửi duyệt.", "error"));
        }
        
        // BR-CRS-06
        if (totalVideoDuration < 30) {
            errors.add(new ValidationError("MSG-COURSE-016", "Video Course cần có tổng thời lượng video tối thiểu 30 phút trước khi gửi duyệt.", "error"));
        }
    }

    private void validateContentBlocks(Course course, List<ValidationError> errors) {
        List<CourseModule> modules = course.getModules();
        if (modules == null || modules.isEmpty()) return;
        
        boolean hasJapaneseEvidence = false;
        
        for (CourseModule module : modules) {
            List<LessonBlock> blocks = module.getBlocks();
            if (blocks == null || blocks.isEmpty()) continue;
            
            for (int i = 0; i < blocks.size(); i++) {
                LessonBlock block = blocks.get(i);
                
                // BR-CRS-02
                if (block.getType() == LessonBlockType.QUIZ || block.getType() == LessonBlockType.FLASHCARD || block.getType() == LessonBlockType.WRITING) {
                    hasJapaneseEvidence = true;
                }
                
                // BR-CRS-03
                if (block.getType() == LessonBlockType.VIDEO && block.getDurationMinutes() != null && block.getDurationMinutes() > 15) {
                    boolean hasInteractionAfter = false;
                    if (i + 1 < blocks.size()) {
                        LessonBlockType nextType = blocks.get(i + 1).getType();
                        if (nextType == LessonBlockType.QUIZ || nextType == LessonBlockType.FLASHCARD || nextType == LessonBlockType.WRITING) {
                            hasInteractionAfter = true;
                        }
                    }
                    if (!hasInteractionAfter) {
                        errors.add(new ValidationError("MSG-COURSE-009", "Video vượt quá 15 phút nhưng không có Quiz/Flashcard/Writing ngay sau.", "error"));
                    }
                }
                
                // BR-CONTENT-02
                if (block.getType() == LessonBlockType.QUIZ) {
                    if (!StringUtils.hasText(block.getQuizAnswer())) {
                        errors.add(new ValidationError("MSG-COURSE-013", "Câu hỏi quiz cần có đáp án đúng trước khi lưu.", "error"));
                    }
                }
                
                // BR-CONTENT-03
                if (block.getType() == LessonBlockType.FLASHCARD && StringUtils.hasText(block.getFlashcardsJson())) {
                    try {
                        List<Map<String, String>> flashcards = objectMapper.readValue(block.getFlashcardsJson(), new TypeReference<>() {});
                        Set<String> fronts = new HashSet<>();
                        for (Map<String, String> card : flashcards) {
                            String front = card.get("front");
                            if (front != null && !fronts.add(front.trim().toLowerCase())) {
                                errors.add(new ValidationError("MSG-COURSE-010", "Phát hiện thẻ từ vựng bị trùng lặp. Vui lòng kiểm tra lại bộ Flashcard.", "error"));
                                break;
                            }
                        }
                    } catch (Exception e) {
                        log.error("Failed to parse flashcards JSON for block {}", block.getId(), e);
                    }
                }
                
                // BR-CONTENT-04
                if (block.getType() == LessonBlockType.WRITING && !StringUtils.hasText(block.getRubric())) {
                    errors.add(new ValidationError("MSG-WRITE-005", "Bài writing cần chọn rubric đánh giá trước khi lưu.", "error"));
                }
            }
        }
        
        if (!hasJapaneseEvidence) {
            errors.add(new ValidationError("MSG-COURSE-012", "Bài học cần có bằng chứng học tiếng Nhật (từ vựng, ngữ pháp, quiz, flashcard...).", "error"));
        }
    }

    private void validateFinalTest(Course course, List<ValidationError> errors) {
        // TODO: Implement FinalTest validation once FinalTest entity is available in the module.
    }
}
