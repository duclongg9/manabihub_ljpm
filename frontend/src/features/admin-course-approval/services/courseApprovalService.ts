import { axiosClient } from '../../../shared/api/axiosClient';
import { ENDPOINTS } from '../../../shared/api/endpoints';
import type { CourseApproval, CourseApprovalDetail, ReviewActionPayload } from '../types';

export const courseApprovalService = {
  getQueue: async (): Promise<CourseApproval[]> => {
    const res = await axiosClient.get(ENDPOINTS.ADMIN_COURSE_APPROVAL.QUEUE);
    return res.data.data;
  },

  getDetail: async (id: string): Promise<CourseApprovalDetail> => {
    const res = await axiosClient.get(ENDPOINTS.ADMIN_COURSE_APPROVAL.DETAIL(id));
    return res.data.data;
  },

  reviewCourse: async (id: string, payload: ReviewActionPayload): Promise<void> => {
    await axiosClient.post(ENDPOINTS.ADMIN_COURSE_APPROVAL.REVIEW(id), payload);
  }
};
