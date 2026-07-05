package com.manabihub.identity.mapper;

import com.manabihub.identity.dto.request.UpdateTeacherProfileRequest;
import com.manabihub.identity.dto.response.TeacherProfileResponse;
import com.manabihub.identity.entity.StudentProfile;
import com.manabihub.kyc.domain.AppUser;
import com.manabihub.kyc.domain.TeacherProfile;
import org.springframework.stereotype.Component;

@Component
public class TeacherProfileMapper {

    public TeacherProfileResponse toResponse(
            AppUser user,
            StudentProfile studentProfile,
            TeacherProfile teacherProfile
    ) {

        TeacherProfileResponse response = new TeacherProfileResponse();

        response.setId(user.getId());
        response.setEmail(user.getEmail());
        response.setFullName(user.getFullName());
        response.setPhoneNumber(user.getPhoneNumber());
        response.setAvatarUrl(user.getAvatarUrl());

        response.setDisplayName(studentProfile.getDisplayName());
        response.setJlptGoal(studentProfile.getJlptGoal());

        response.setBio(teacherProfile.getBio());

        return response;
    }

    public void updateUser(
            AppUser user,
            UpdateTeacherProfileRequest request
    ) {
        user.setFullName(request.getFullName());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setAvatarUrl(request.getAvatarUrl());
    }

    public void updateProfile(
            TeacherProfile teacherProfile,
            UpdateTeacherProfileRequest request
    ) {
        teacherProfile.setBio(request.getBio());
    }
}