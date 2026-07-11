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
        // BR-COURSE-04 & Extended Metadata Check
        if (!StringUtils.hasText(course.getTitle()) || 
            course.getJlptLevel() == null ||
            !StringUtils.hasText(course.getIntroduction()) ||
            !StringUtils.hasText(course.getOutcomes()) ||
            !StringUtils.hasText(course.getThumbnailUrl()) ||
            !StringUtils.hasText(course.getCategory()) ||
            course.getPrice() == null) {
            
            errors.add(new ValidationError("MSG-COURSE-004", "Sản phẩm chưa đáp ứng điều kiện gửi duyệt.", "error"));
        } else {
            int titleLen = course.getTitle().trim().length();
            if (titleLen < 10 || titleLen > 100) {
                errors.add(new ValidationError("MSG-COURSE-020", "Tiêu đề khóa học phải từ 10 đến 100 ký tự.", "error"));
            }
            if (!course.getThumbnailUrl().toLowerCase().startsWith("http")) {
                errors.add(new ValidationError("MSG-COURSE-021", "Đường dẫn ảnh thu nhỏ không hợp lệ (phải bắt đầu bằng http/https).", "error"));
            }
        }
        
        // BR-COURSE-05 (Strict)
        if (course.getPrice() != null) {
            double price = course.getPrice().doubleValue();
            if (price < 0) {
                errors.add(new ValidationError("MSG-COURSE-003", "Giá sản phẩm không được thấp hơn mức tối thiểu của nền tảng.", "error"));
            } else if (price > 0 && price < 10000) {
                errors.add(new ValidationError("MSG-COURSE-003", "Giá sản phẩm nếu có thu phí phải lớn hơn hoặc bằng 10,000 VND.", "error"));
            }
        }
    }

    private void validateGoals(Course course, List<ValidationError> errors) {
        // BR-GOAL-01
        List<CourseLearningGoal> goals = course.getLearningGoals();
        if (goals == null || goals.size() < 4) {
            errors.add(new ValidationError("MSG-GOAL-001", "Vui lòng nhập tối thiểu 4 mục tiêu học tập.", "error"));
        }
        
        // BR-GOAL-02 & Duplicate Check
        if (goals != null) {
            Set<String> uniqueGoals = new HashSet<>();
            for (CourseLearningGoal goal : goals) {
                String text = goal.getGoalText();
                if (!StringUtils.hasText(text) || text.length() > 160) {
                    errors.add(new ValidationError("MSG-GOAL-002", "Mỗi mục tiêu học tập không được vượt quá 160 ký tự.", "error"));
                    break;
                }
                if (!uniqueGoals.add(text.trim().toLowerCase())) {
                    errors.add(new ValidationError("MSG-GOAL-005", "Phát hiện mục tiêu học tập bị trùng lặp. Vui lòng kiểm tra lại.", "error"));
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
            if (module.getBlocks() == null || module.getBlocks().isEmpty()) {
                errors.add(new ValidationError("MSG-COURSE-017", "Không được phép có Module rỗng (Module chưa có bài học nào).", "error"));
            } else {
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
        
        // Flatten blocks for cross-module video limit check
        List<LessonBlock> allBlocks = new ArrayList<>();
        for (CourseModule module : modules) {
            if (module.getBlocks() != null) {
                allBlocks.addAll(module.getBlocks());
            }
        }
        
        if (allBlocks.isEmpty()) return;
        
        for (int i = 0; i < allBlocks.size(); i++) {
            LessonBlock block = allBlocks.get(i);
            
            // BR-CRS-02
            if (block.getType() == LessonBlockType.QUIZ || block.getType() == LessonBlockType.FLASHCARD || block.getType() == LessonBlockType.WRITING) {
                hasJapaneseEvidence = true;
            }
            
            // BR-CRS-03 (Cross-Module check)
            if (block.getType() == LessonBlockType.VIDEO && block.getDurationMinutes() != null && block.getDurationMinutes() > 15) {
                boolean hasInteractionAfter = false;
                if (i + 1 < allBlocks.size()) {
                    LessonBlockType nextType = allBlocks.get(i + 1).getType();
                    if (nextType == LessonBlockType.QUIZ || nextType == LessonBlockType.FLASHCARD || nextType == LessonBlockType.WRITING) {
                        hasInteractionAfter = true;
                    }
                }
                if (!hasInteractionAfter) {
                    errors.add(new ValidationError("MSG-COURSE-009", "Video vượt quá 15 phút nhưng không có Quiz/Flashcard/Writing ngay sau.", "error"));
                }
            }
                
                // BR-CONTENT-02 & Quiz Options Check
                if (block.getType() == LessonBlockType.QUIZ) {
                    if (!StringUtils.hasText(block.getQuizAnswer())) {
                        errors.add(new ValidationError("MSG-COURSE-013", "Câu hỏi quiz cần có đáp án đúng trước khi lưu.", "error"));
                    } else if (StringUtils.hasText(block.getQuizOptionsJson())) {
                        try {
                            List<Map<String, Object>> options = objectMapper.readValue(block.getQuizOptionsJson(), new TypeReference<>() {});
                            boolean answerMatches = options.stream()
                                    .anyMatch(opt -> block.getQuizAnswer().equals(opt.get("id")) || block.getQuizAnswer().equals(opt.get("value")) || block.getQuizAnswer().equals(opt.get("text")));
                            if (!answerMatches) {
                                errors.add(new ValidationError("MSG-COURSE-014", "Đáp án đúng không khớp với bất kỳ lựa chọn nào trong danh sách.", "error"));
                            }
                        } catch (Exception e) {
                            log.error("Failed to parse quiz options JSON for block {}", block.getId(), e);
                        }
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
        
        if (!hasJapaneseEvidence) {
            errors.add(new ValidationError("MSG-COURSE-012", "Bài học cần có bằng chứng học tiếng Nhật (từ vựng, ngữ pháp, quiz, flashcard...).", "error"));
        }
    }

    private void validateFinalTest(Course course, List<ValidationError> errors) {
        // TODO: Implement FinalTest validation once FinalTest entity is available in the module.
    }
}
