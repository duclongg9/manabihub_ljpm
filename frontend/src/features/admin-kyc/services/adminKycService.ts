import { axiosClient } from '../../../shared/api/axiosClient';
import { ENDPOINTS } from '../../../shared/api/endpoints';

export interface KycRequestResponse {
  id: string;
  teacherId: string;
  teacherEmail: string;
  teacherFullName: string;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CORRECTION_REQUIRED';
  displayName: string;
  idCardFrontUrl: string;
  idCardBackUrl: string;
  certificateUrl: string;
  selfieUrl: string;
  copyrightAccepted: boolean;
  vnptVerificationStatus: string;
  vnptResponseDetails: string;
  riskLevel: string;
  decisionNote: string | null;
  createdAt: string;
  updatedAt: string;
  processedByEmail: string | null;
  processedAt: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  messageCode: string;
  message: string;
  data: T;
  errors?: any;
}

export interface KycReviewRequest {
  status: 'APPROVED' | 'REJECTED' | 'CORRECTION_REQUIRED';
  decisionNote?: string;
}

// Map database statuses to human-friendly labels
export const KYC_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  CORRECTION_REQUIRED: 'Yêu cầu sửa đổi',
  DRAFT: 'Bản nháp',
};

export const adminKycService = {
  getPendingKycQueue: async (): Promise<KycRequestResponse[]> => {
    const response = await axiosClient.get<ApiResponse<KycRequestResponse[]>>(
      ENDPOINTS.ADMIN_KYC.QUEUE
    );
    return response.data.data;
  },

  getKycDetail: async (id: string): Promise<KycRequestResponse> => {
    const response = await axiosClient.get<ApiResponse<KycRequestResponse>>(
      ENDPOINTS.ADMIN_KYC.DETAIL(id)
    );
    return response.data.data;
  },

  reviewKyc: async (id: string, request: KycReviewRequest): Promise<KycRequestResponse> => {
    const response = await axiosClient.post<ApiResponse<KycRequestResponse>>(
      ENDPOINTS.ADMIN_KYC.REVIEW(id),
      request
    );
    return response.data.data;
  },
};
