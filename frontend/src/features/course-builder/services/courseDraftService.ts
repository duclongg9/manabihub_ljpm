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

export function courseDraftErrorMessage(error: unknown) {
  if (axios.isAxiosError<ApiResponse<unknown>>(error)) {
    return error.response?.data?.message ?? 'Could not save course draft.';
  }

  return 'Could not save course draft.';
}
