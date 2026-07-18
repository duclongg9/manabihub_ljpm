import { axiosClient } from '../../../shared/api/axiosClient';
import { ENDPOINTS } from '../../../shared/api/endpoints';
import type { ApiResponse, PageResponse } from '../../../shared/types/api';
import type {
  TeacherWritingFeedbackPayload,
  WritingSubmissionDetail,
  WritingSubmissionSummary,
} from '../types/writingReviewTypes';

export interface WritingReviewListParams {
  page: number;
  size: number;
  query?: string;
  reviewed?: boolean;
}

export const writingReviewService = {
  async listSubmissions(
    params: WritingReviewListParams,
  ): Promise<PageResponse<WritingSubmissionSummary>> {
    const response = await axiosClient.get<
      ApiResponse<PageResponse<WritingSubmissionSummary>>
    >(ENDPOINTS.teacherWriting.submissions, { params });
    return response.data.data;
  },

  async getSubmission(submissionId: string): Promise<WritingSubmissionDetail> {
    const response = await axiosClient.get<ApiResponse<WritingSubmissionDetail>>(
      ENDPOINTS.teacherWriting.detail(submissionId),
    );
    return response.data.data;
  },

  async saveFeedback(
    submissionId: string,
    payload: TeacherWritingFeedbackPayload,
  ): Promise<WritingSubmissionDetail> {
    const response = await axiosClient.put<ApiResponse<WritingSubmissionDetail>>(
      ENDPOINTS.teacherWriting.feedback(submissionId),
      payload,
    );
    return response.data.data;
  },
};
