import { axiosClient } from '../../../shared/api/axiosClient';

export interface ViolationReportRequest {
  targetType: 'COURSE' | 'LESSON' | 'LESSON_BLOCK' | 'REVIEW' | 'USER';
  targetId: string;
  reason: string;
}

export const submitViolationReport = async (data: ViolationReportRequest) => {
  const response = await axiosClient.post('/api/v1/violations', data);
  return response.data;
};
