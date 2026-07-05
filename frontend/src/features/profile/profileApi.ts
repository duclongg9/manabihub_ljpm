import { axiosClient } from "../../shared/api/axiosClient";
import { ENDPOINTS } from "../../shared/api/endpoints";

import type {
    ApiEnvelope,
    StudentProfileResponse,
    TeacherProfileResponse,
    UpdateStudentProfileRequest,
    UpdateTeacherProfileRequest,
} from "./profileTypes";

/* ==========================
   STUDENT
========================== */

export async function getMyStudentProfile() {

    const response =
        await axiosClient.get<ApiEnvelope<StudentProfileResponse>>(
            ENDPOINTS.profile.student
        );

    return response.data.data;

}

export async function updateMyStudentProfile(
    payload: UpdateStudentProfileRequest
) {

    const response =
        await axiosClient.put<ApiEnvelope<StudentProfileResponse>>(
            ENDPOINTS.profile.student,
            payload
        );

    return response.data.data;

}

/* ==========================
   TEACHER
========================== */

export async function getMyTeacherProfile() {

    const response =
        await axiosClient.get<ApiEnvelope<TeacherProfileResponse>>(
            ENDPOINTS.profile.teacher
        );

    return response.data.data;

}

export async function updateMyTeacherProfile(
    payload: UpdateTeacherProfileRequest
) {

    const response =
        await axiosClient.put<ApiEnvelope<TeacherProfileResponse>>(
            ENDPOINTS.profile.teacher,
            payload
        );

    return response.data.data;

}