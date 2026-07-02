import { axiosClient } from '../../shared/api/axiosClient';
import { ENDPOINTS } from '../../shared/api/endpoints';

export const DEMO_TEACHER_USER_ID = 'd0000000-0000-0000-0000-000000000003';

export interface ApiEnvelope<T> {
  success: boolean;
  messageCode: string;
  message: string;
  data: T;
  timestamp: string;
  path?: string;
}

export interface KycDocumentResponse {
  id: string;
  documentType: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  fileHash: string;
  createdAt: string;
}

export interface KycRequestResponse {
  requestId: string;
  status: string;
  statusLabel: string;
  submittedAt: string;
  ekycProvider: string;
  ekycReferenceId: string;
  riskLevel: string;
  certificateCode?: string | null;
  copyrightAgreed: boolean;
  verificationPayload: Record<string, unknown>;
  documents: KycDocumentResponse[];
}

export interface KycStatusResponse {
  teacherId: string;
  userId: string;
  teacherKycStatus: string;
  teacherKycStatusLabel: string;
  canPublishCourse: boolean;
  latestRequest?: KycRequestResponse | null;
  srsTrace: Record<string, unknown>;
}

export interface KycSubmissionResponse {
  teacherId: string;
  teacherKycStatus: string;
  canPublishCourse: boolean;
  request: KycRequestResponse;
  adminNotificationCreated: boolean;
  auditLogged: boolean;
  srsTrace: Record<string, unknown>;
}

export interface KycSubmissionPayload {
  cccdFront: File;
  cccdBack: File;
  selfie: File;
  certificate: File;
  copyrightAgreement: File;
  copyrightAgreementAccepted: boolean;
  certificateCode?: string;
}

export async function getTeacherKycStatus() {
  const response = await axiosClient.get<ApiEnvelope<KycStatusResponse>>(ENDPOINTS.teacherKyc.status, {
    headers: demoTeacherHeaders(),
  });

  return response.data.data;
}

export async function submitTeacherKyc(payload: KycSubmissionPayload) {
  const formData = new FormData();
  formData.append('cccdFront', payload.cccdFront);
  formData.append('cccdBack', payload.cccdBack);
  formData.append('selfie', payload.selfie);
  formData.append('certificate', payload.certificate);
  formData.append('copyrightAgreement', payload.copyrightAgreement);
  formData.append('copyrightAgreementAccepted', String(payload.copyrightAgreementAccepted));

  if (payload.certificateCode?.trim()) {
    formData.append('certificateCode', payload.certificateCode.trim());
  }

  const response = await axiosClient.post<ApiEnvelope<KycSubmissionResponse>>(ENDPOINTS.teacherKyc.submissions, formData, {
    headers: {
      ...demoTeacherHeaders(),
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}

function demoTeacherHeaders() {
  return {
    'X-Demo-User-Id': DEMO_TEACHER_USER_ID,
  };
}
