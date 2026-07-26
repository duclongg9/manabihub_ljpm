import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  writingReviewService,
  type WritingReviewListParams,
} from '../services/writingReviewService';
import type { TeacherWritingFeedbackPayload } from '../types/writingReviewTypes';

export const writingReviewKeys = {
  all: ['teacher-writing-reviews'] as const,
  list: (params: WritingReviewListParams) => [...writingReviewKeys.all, 'list', params] as const,
  detail: (submissionId: string) => [...writingReviewKeys.all, 'detail', submissionId] as const,
};

export function useWritingReviews(params: WritingReviewListParams) {
  return useQuery({
    queryKey: writingReviewKeys.list(params),
    queryFn: () => writingReviewService.listSubmissions(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useWritingReviewDetail(submissionId: string) {
  return useQuery({
    queryKey: writingReviewKeys.detail(submissionId),
    queryFn: () => writingReviewService.getSubmission(submissionId),
    enabled: Boolean(submissionId),
  });
}

export function useSaveWritingFeedback(submissionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: TeacherWritingFeedbackPayload) =>
      writingReviewService.saveFeedback(submissionId, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(writingReviewKeys.detail(submissionId), data);
      queryClient.invalidateQueries({ queryKey: writingReviewKeys.all });
    },
  });
}
