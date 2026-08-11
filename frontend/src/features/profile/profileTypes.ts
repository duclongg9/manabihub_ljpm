export interface ApiEnvelope<T> {
    success: boolean;
    messageCode: string;
    message: string;
    data: T;
    timestamp: string;
}

/* ==========================
   Response
========================== */

export interface UserProfileResponse {
    id: string;
    email: string;
    fullName: string;
    phoneNumber: string | null;
    phoneVerified: boolean;
    phoneVerifiedAt: string | null;
    avatarUrl: string | null;
}

export interface StudentProfileResponse
    extends UserProfileResponse {

    displayName: string;

    jlptGoal: string;

}

export interface TeacherProfileResponse
    extends StudentProfileResponse {

    bio: string;

}

/* ==========================
   Request
========================== */

export interface UpdateStudentProfileRequest {

    fullName: string;

    phoneNumber: string | null;

    displayName: string;

    jlptGoal: string;

}

export interface PhoneVerificationResponse {
    phoneNumber: string;
    verified: boolean;
    verifiedAt: string | null;
}

export interface UpdateTeacherProfileRequest
    extends UpdateStudentProfileRequest {

    bio: string;

}
