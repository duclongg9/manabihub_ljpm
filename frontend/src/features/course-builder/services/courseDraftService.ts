import axios from 'axios';
import { axiosClient } from '../../../shared/api/axiosClient';
import { ENDPOINTS } from '../../../shared/api/endpoints';

export type JlptLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
export type CourseStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'PUBLISHED' | 'REJECTED' | 'FORCED_DRAFT' | 'ARCHIVED';

export interface CreateCourseDraftPayload {
  title: string;
  introduction: string;
  jlptLevel: JlptLevel;
  category: string;
  thumbnailUrl?: string | null;
  outcomes: string;
  price: number;
  prerequisites: string;
  targetStudents: string;
  learningGoals: string[];
}

export interface CourseDraftResponse {
  id: string;
  teacherId: string;
  title: string;
  slug: string;
  introduction: string;
  jlptLevel: JlptLevel;
  category: string;
  thumbnailUrl?: string | null;
  outcomes: string;
  price: number;
  currency: string;
  prerequisites: string;
  targetStudents: string;
  status: CourseStatus;
  learningGoals: string[];
  createdAt?: string | null;
  srsTrace: Record<string, unknown>;
}

export interface CourseCategory {
  id: string;
  code: string;
  name: string;
  description?: string | null;
}

export interface CourseThumbnailUploadResponse {
  publicUrl: string;
  fileName: string;
  contentType: string;
  size: number;
}

interface ApiResponse<T> {
  success: boolean;
  messageCode?: string;
  message?: string;
  data: T;
}

export async function createCourseDraft(payload: CreateCourseDraftPayload) {
  const response = await axiosClient.post<ApiResponse<CourseDraftResponse>>(
    ENDPOINTS.teacherCourses.drafts,
    payload,
  );

  return response.data.data;
}

export async function updateCourseDraft(id: string, payload: CreateCourseDraftPayload) {
  const response = await axiosClient.put<ApiResponse<CourseDraftResponse>>(
    ENDPOINTS.teacherCourses.draftDetail(id),
    payload,
  );

  return response.data.data;
}

export async function fetchCourseDrafts() {
  const response = await axiosClient.get<ApiResponse<CourseDraftResponse[]>>(ENDPOINTS.teacherCourses.drafts);

  return response.data.data;
}

export async function deleteCourseDraft(id: string) {
  await axiosClient.delete<ApiResponse<void>>(ENDPOINTS.teacherCourses.draftDetail(id));
}

export async function fetchCourseCategories() {
  const response = await axiosClient.get<ApiResponse<CourseCategory[]>>(ENDPOINTS.courseCategories.list);

  return response.data.data;
}

export async function uploadCourseThumbnail(file: File) {
  const formData = new FormData();
  formData.append('thumbnail', file);

  const response = await axiosClient.post<ApiResponse<CourseThumbnailUploadResponse>>(
    ENDPOINTS.teacherCourseAssets.thumbnails,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  return response.data.data;
}

export function courseDraftApiError(error: unknown) {
  if (axios.isAxiosError<ApiResponse<unknown>>(error)) {
    return {
      messageCode: error.response?.data?.messageCode,
      message: error.response?.data?.message ?? 'Không thể lưu bản nháp khóa học.',
    };
  }

  return {
    messageCode: undefined,
    message: 'Không thể lưu bản nháp khóa học.',
  };
}
