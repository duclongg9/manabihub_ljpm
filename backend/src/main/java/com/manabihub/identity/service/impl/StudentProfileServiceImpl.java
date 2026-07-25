package com.manabihub.identity.service.impl;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.identity.dto.request.UpdateStudentProfileRequest;
import com.manabihub.identity.dto.response.StudentProfileResponse;
import com.manabihub.identity.entity.AppUser;
import com.manabihub.identity.entity.StudentProfile;
import com.manabihub.identity.mapper.StudentProfileMapper;
import com.manabihub.identity.repository.AppUserRepository;
import com.manabihub.identity.repository.StudentProfileRepository;
import com.manabihub.identity.service.CurrentUserService;
import com.manabihub.identity.service.StudentProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class StudentProfileServiceImpl implements StudentProfileService {

    private final AppUserRepository appUserRepository;

    private final StudentProfileRepository studentProfileRepository;

    private final StudentProfileMapper studentProfileMapper;

    private final CurrentUserService currentUserService;

    @Override
    @Transactional(readOnly = true)
    public StudentProfileResponse getMyProfile() {

        UUID userId = currentUserService.getCurrentUserId();

        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.COMMON_NOT_FOUND,
                        "User not found",
                        HttpStatus.NOT_FOUND
                ));

        StudentProfile profile = studentProfileRepository.findByUser_Id(userId)
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.COMMON_NOT_FOUND,
                        "Student profile not found",
                        HttpStatus.NOT_FOUND
                ));

        return studentProfileMapper.toResponse(user, profile);
    }

    @Override
    public StudentProfileResponse updateMyProfile(UpdateStudentProfileRequest request) {

        UUID userId = currentUserService.getCurrentUserId();

        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.COMMON_NOT_FOUND,
                        "User not found",
                        HttpStatus.NOT_FOUND
                ));

        StudentProfile profile = studentProfileRepository.findByUser_Id(userId)
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.COMMON_NOT_FOUND,
                        "Student profile not found",
                        HttpStatus.NOT_FOUND
                ));

        studentProfileMapper.updateUser(user, request);

        studentProfileMapper.updateProfile(profile, request);

        try {

            appUserRepository.save(user);

            studentProfileRepository.save(profile);

        } catch (Exception ex) {

            throw new BusinessException(
                    MessageCodes.MSG_COM_004,
                    "Save profile failed",
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    ex
            );

        }

        return studentProfileMapper.toResponse(user, profile);

    }

}
