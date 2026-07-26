package com.manabihub.identity.mapper;

import com.manabihub.identity.dto.request.UpdateStudentProfileRequest;
import com.manabihub.identity.dto.response.StudentProfileResponse;
import com.manabihub.identity.entity.AppUser;
import com.manabihub.identity.entity.StudentProfile;
import org.springframework.stereotype.Component;

@Component
public class StudentProfileMapper {

    /**
     * Convert AppUser + StudentProfile -> StudentProfileResponse
     */
    public StudentProfileResponse toResponse(
            AppUser user,
            StudentProfile profile
    ) {

        StudentProfileResponse response = new StudentProfileResponse();

        response.setId(user.getId());
        response.setEmail(user.getEmail());
        response.setFullName(user.getFullName());
        response.setPhoneNumber(user.getPhoneNumber());
        response.setAvatarUrl(user.getAvatarUrl());

        response.setDisplayName(profile.getDisplayName());
        response.setJlptGoal(profile.getJlptGoal());

        return response;
    }

    /**
     * Update StudentProfile from request
     */
    public void updateProfile(
            StudentProfile profile,
            UpdateStudentProfileRequest request
    ) {

        profile.setDisplayName(request.getDisplayName());
        profile.setJlptGoal(request.getJlptGoal());
    }

    /**
     * Update AppUser from request
     */
    public void updateUser(
            AppUser user,
            UpdateStudentProfileRequest request
    ) {

        user.setFullName(request.getFullName());
        user.setPhoneNumber(request.getPhoneNumber());
        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl());
        }
    }

}
