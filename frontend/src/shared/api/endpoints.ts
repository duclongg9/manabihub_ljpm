export const ENDPOINTS = {
  ADMIN_KYC: {
    QUEUE: '/v1/admin/kyc-requests',
    DETAIL: (id: string) => `/v1/admin/kyc-requests/${id}`,
    REVIEW: (id: string) => `/v1/admin/kyc-requests/${id}/review`,
  },
  teacherKyc: {
    status: '/v1/teacher/kyc/status',
    identityVerifications: '/v1/teacher/kyc/identity-verifications',
    restartVerification: '/v1/teacher/kyc/restart-verification',
    certificateSubmissions: '/v1/teacher/kyc/certificate-submissions',
  },
  ADMIN_LOGIN: '/admin/auth/login',
};
