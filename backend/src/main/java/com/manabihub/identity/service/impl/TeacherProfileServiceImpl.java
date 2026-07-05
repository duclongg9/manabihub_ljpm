package com.manabihub.identity.service.impl;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.identity.dto.request.UpdateTeacherProfileRequest;
import com.manabihub.identity.dto.response.TeacherProfileResponse;
import com.manabihub.identity.entity.StudentProfile;
import com.manabihub.identity.mapper.TeacherProfileMapper;
import com.manabihub.identity.repository.StudentProfileRepository;
import com.manabihub.identity.repository.UserRepository;
import com.manabihub.identity.service.CurrentUserService;
import com.manabihub.identity.service.TeacherProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.manabihub.identity.repository.IdentityTeacherProfileRepository;
import com.manabihub.kyc.domain.AppUser;
import com.manabihub.kyc.domain.TeacherProfile;


import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class TeacherProfileServiceImpl implements TeacherProfileService {

    private final UserRepository userRepository;

    private final StudentProfileRepository studentProfileRepository;

    private final IdentityTeacherProfileRepository teacherProfileRepository;

    private final TeacherProfileMapper teacherProfileMapper;

    private final CurrentUserService currentUserService;

    @Override
    @Transactional(readOnly = true)
    public TeacherProfileResponse getMyProfile() {

        UUID userId = currentUserService.getCurrentUserId();
        System.out.println("Current User ID = " + userId);

        AppUser user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.COMMON_NOT_FOUND,
                        "User not found",
                        HttpStatus.NOT_FOUND));

        StudentProfile studentProfile = studentProfileRepository.findByUser_Id(userId)
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.COMMON_NOT_FOUND,
                        "Student profile not found",
                        HttpStatus.NOT_FOUND));

        TeacherProfile teacherProfile = teacherProfileRepository.findByUser_Id(userId)
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.COMMON_NOT_FOUND,
                        "Teacher profile not found",
                        HttpStatus.NOT_FOUND));

        TeacherProfileResponse response =
                teacherProfileMapper.toResponse(
                        user,
                        studentProfile,
                        teacherProfile
                );

        // Teacher kế thừa Student
        response.setDisplayName(studentProfile.getDisplayName());
        response.setJlptGoal(studentProfile.getJlptGoal());

        return response;
    }

    @Override
    public TeacherProfileResponse updateMyProfile(UpdateTeacherProfileRequest request) {

        UUID userId = currentUserService.getCurrentUserId();

        AppUser user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.COMMON_NOT_FOUND,
                        "User not found",
                        HttpStatus.NOT_FOUND));

        StudentProfile studentProfile = studentProfileRepository.findByUser_Id(userId)
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.COMMON_NOT_FOUND,
                        "Student profile not found",
                        HttpStatus.NOT_FOUND));

        TeacherProfile teacherProfile = teacherProfileRepository.findByUser_Id(userId)
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.COMMON_NOT_FOUND,
                        "Teacher profile not found",
                        HttpStatus.NOT_FOUND));

        teacherProfileMapper.updateUser(user, request);

        studentProfile.setDisplayName(request.getDisplayName());
        studentProfile.setJlptGoal(request.getJlptGoal());

        teacherProfileMapper.updateProfile(teacherProfile, request);

        try {

            userRepository.save(user);

            studentProfileRepository.save(studentProfile);

            teacherProfileRepository.save(teacherProfile);

        } catch (Exception ex) {

            throw new BusinessException(
                    MessageCodes.MSG_COM_004,
                    "Update profile failed",
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    ex
            );

        }

        TeacherProfileResponse response =
                teacherProfileMapper.toResponse(
                        user,
                        studentProfile,
                        teacherProfile
                );

        response.setDisplayName(studentProfile.getDisplayName());
        response.setJlptGoal(studentProfile.getJlptGoal());

        return response;
    }
}