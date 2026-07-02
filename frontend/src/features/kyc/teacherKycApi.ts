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

export interface KycModuleStatusResponse {
  status: string;
  statusLabel: string;
  canInteract: boolean;
  completedAt?: string | null;
  detail?: string | null;
}

export interface KycRequestResponse {
  requestId: string;
  status: string;
  statusLabel: string;
  submittedAt: string;
  ekycProvider?: string | null;
  ekycReferenceId?: string | null;
  providerSessionId?: string | null;
  providerTransactionId?: string | null;
  identityStatus: string;
  identityStatusLabel: string;
  identityVerifiedAt?: string | null;
  certificateStatus: string;
  certificateStatusLabel: string;
  certificateSubmittedAt?: string | null;
  riskLevel?: string | null;
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
  identityVerification: KycModuleStatusResponse;
  certificateVerification: KycModuleStatusResponse;
  latestRequest?: KycRequestResponse | null;
  srsTrace: Record<string, unknown>;
}

export interface KycIdentityVerificationPayload {
  providerSessionId?: string | null;
  providerTransactionId?: string | null;
  sdkResult: Record<string, unknown>;
}

export interface KycIdentityVerificationResponse {
  teacherId: string;
  teacherKycStatus: string;
  request: KycRequestResponse;
  identityVerification: KycModuleStatusResponse;
  certificateVerification: KycModuleStatusResponse;
  auditLogged: boolean;
  srsTrace: Record<string, unknown>;
}

export interface KycCertificateSubmissionResponse {
  teacherId: string;
  teacherKycStatus: string;
  canPublishCourse: boolean;
  request: KycRequestResponse;
  identityVerification: KycModuleStatusResponse;
  certificateVerification: KycModuleStatusResponse;
  adminNotificationCreated: boolean;
  auditLogged: boolean;
  srsTrace: Record<string, unknown>;
}

export interface KycRestartVerificationResponse {
  teacherId: string;
  teacherKycStatus: string;
  canPublishCourse: boolean;
  request: KycRequestResponse;
  identityVerification: KycModuleStatusResponse;
  certificateVerification: KycModuleStatusResponse;
  auditLogged: boolean;
  srsTrace: Record<string, unknown>;
}

export interface KycCertificateSubmissionPayload {
  certificate: File;
  certificateCode: string;
  copyrightAgreementAccepted: boolean;
}

export async function getTeacherKycStatus() {
  const response = await axiosClient.get<ApiEnvelope<KycStatusResponse>>(ENDPOINTS.teacherKyc.status, {
    headers: demoTeacherHeaders(),
  });

  return response.data.data;
}

export async function verifyTeacherIdentity(payload: KycIdentityVerificationPayload) {
  const response = await axiosClient.post<ApiEnvelope<KycIdentityVerificationResponse>>(
    ENDPOINTS.teacherKyc.identityVerifications,
    payload,
    {
      headers: demoTeacherHeaders(),
    },
  );

  return response.data;
}

export async function restartTeacherVerification() {
  const response = await axiosClient.post<ApiEnvelope<KycRestartVerificationResponse>>(
    ENDPOINTS.teacherKyc.restartVerification,
    undefined,
    {
      headers: demoTeacherHeaders(),
    },
  );

  return response.data;
}

export async function submitTeacherCertificate(payload: KycCertificateSubmissionPayload) {
  const formData = new FormData();
  formData.append('certificate', payload.certificate);
  formData.append('certificateCode', payload.certificateCode.trim());
  formData.append('copyrightAgreementAccepted', String(payload.copyrightAgreementAccepted));

  const response = await axiosClient.post<ApiEnvelope<KycCertificateSubmissionResponse>>(
    ENDPOINTS.teacherKyc.certificateSubmissions,
    formData,
    {
      headers: {
        ...demoTeacherHeaders(),
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  return response.data;
}

function demoTeacherHeaders() {
  return {
    'X-Demo-User-Id': DEMO_TEACHER_USER_ID,
  };
}
