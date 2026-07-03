export const ENDPOINTS = {
  ADMIN_KYC: {
    QUEUE: '/admin/kyc',
    DETAIL: (id: string) => `/admin/kyc/${id}`,
    REVIEW: (id: string) => `/admin/kyc/${id}/review`,
  },
  teacherKyc: {
    status: '/v1/teacher/kyc/status',
    identityVerifications: '/v1/teacher/kyc/identity-verifications',
    restartVerification: '/v1/teacher/kyc/restart-verification',
    certificateSubmissions: '/v1/teacher/kyc/certificate-submissions',
  },
};
