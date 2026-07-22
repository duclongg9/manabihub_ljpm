import { axiosClient } from '../../../shared/api/axiosClient';
import { ENDPOINTS } from '../../../shared/api/endpoints';
import type { CourseLearning, LessonProgress } from '../types';

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

  markLessonComplete: async (blockId: string): Promise<LessonProgress> => {
    const response = await axiosClient.post(ENDPOINTS.LEARNING.MARK_COMPLETE(blockId));
    return response.data.data;
  },
};
