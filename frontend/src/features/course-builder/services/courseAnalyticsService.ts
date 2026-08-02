import { apiClient } from '../../../shared/api/client';

export interface TeacherCourseAnalyticsResponse {
  activeStudents: number;
  completedStudents: number;
  totalRevenue: number;
  averageRating: number | null;
  totalReviews: number;
}

export async function fetchCourseAnalytics(courseId: string): Promise<TeacherCourseAnalyticsResponse> {
  const response = await apiClient.get<{ data: TeacherCourseAnalyticsResponse }>(`/api/v1/teacher/courses/${courseId}/analytics`);
  return response.data.data;
}
