import { axiosClient } from '../../../shared/api/axiosClient';
import type { PublicCourseDetail } from '../types/courseDetailTypes';

export const catalogService = {
  getCourseDetail: async (id: string): Promise<PublicCourseDetail> => {
    const response = await axiosClient.get(`/v1/public/courses/${id}`);
    return response.data.data;
  },
};
