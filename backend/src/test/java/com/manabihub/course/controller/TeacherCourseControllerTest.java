package com.manabihub.course.controller;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.response.ApiResponse;
import com.manabihub.course.service.CourseService;
import com.manabihub.course.service.CourseValidationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class TeacherCourseControllerTest {

    @Mock
    private CourseService courseService;

    @Mock
    private CourseValidationService courseValidationService;

    @InjectMocks
    private TeacherCourseController controller;

    @Test
    void publishCourse_ShouldReturnSrsSuccessMessage() {
        UUID courseId = UUID.randomUUID();

        ResponseEntity<ApiResponse<Void>> response = controller.publishCourse(courseId);

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals(MessageCodes.MSG_COURSE_014, response.getBody().getMessageCode());
        assertEquals(
                "Sản phẩm đã được xuất bản và hiển thị trên danh mục.",
                response.getBody().getMessage()
        );
        verify(courseService).publishCourse(courseId);
    }
}
