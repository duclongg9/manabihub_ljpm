package com.manabihub.ai.controller;

import org.junit.jupiter.api.Test;
import org.springframework.security.access.prepost.PreAuthorize;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class StudentAiChatControllerSecurityTest {

    @Test
    void controllerRequiresStudentRole() {
        PreAuthorize authorization = StudentAiChatController.class.getAnnotation(PreAuthorize.class);

        assertNotNull(authorization);
        assertEquals("hasRole('STUDENT')", authorization.value());
    }
}
