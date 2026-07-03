export const ENDPOINTS = {
  ADMIN_KYC: {
    QUEUE: '/admin/kyc',
    DETAIL: (id: string) => `/admin/kyc/${id}`,
    REVIEW: (id: string) => `/admin/kyc/${id}/review`,
  }
};
