import { axiosClient } from '../../../shared/api/axiosClient';
import { ENDPOINTS } from '../../../shared/api/endpoints';
import type { CourseLearning, LessonProgress, WritingSubmissionDetail } from '../types';

export const learningService = {
  openCourse: async (courseId: string): Promise<CourseLearning> => {
    const response = await axiosClient.get(ENDPOINTS.LEARNING.COURSE_LEARN(courseId));
    return response.data.data;
  },

  saveVideoProgress: async (blockId: string, positionSeconds: number): Promise<LessonProgress> => {
    const response = await axiosClient.put(ENDPOINTS.LEARNING.VIDEO_PROGRESS(blockId), {
      positionSeconds,
    });
    return response.data.data;
  },

  reviewFlashcard: async (blockId: string, cardIndex: number, status: 'REMEMBERED' | 'NEEDS_REVIEW'): Promise<LessonProgress> => {
    const response = await axiosClient.put(ENDPOINTS.LEARNING.FLASHCARD_REVIEW(blockId), {
      cardIndex,
      status,
    });
    return response.data.data;
  },

  markLessonComplete: async (blockId: string): Promise<LessonProgress> => {
    const response = await axiosClient.post(ENDPOINTS.LEARNING.MARK_COMPLETE(blockId));
    return response.data.data;
  },

  getWritingSubmission: async (blockId: string): Promise<WritingSubmissionDetail | null> => {
    const response = await axiosClient.get(ENDPOINTS.LEARNING.WRITING_SUBMISSION_GET(blockId));
    return response.data.data;
  },

  submitWriting: async (blockId: string, content: string): Promise<WritingSubmissionDetail> => {
    const response = await axiosClient.post(ENDPOINTS.LEARNING.WRITING_SUBMISSION_POST(blockId), { content });
    return response.data.data;
  },

  requestAiWritingAssistance: async (blockId: string, submissionId: string): Promise<WritingSubmissionDetail> => {
    const response = await axiosClient.post(ENDPOINTS.LEARNING.WRITING_SUBMISSION_AI(blockId, submissionId));
    return response.data.data;
  },
};
