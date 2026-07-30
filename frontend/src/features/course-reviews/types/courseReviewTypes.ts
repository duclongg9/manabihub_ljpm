import type { PageResponse } from '../../../shared/types/api';

export interface CourseReview {
  id: string;
  rating: number;
  reviewText: string;
  authorDisplayName: string;
  authorAvatarUrl?: string;
  updatedAt: string;
}

export interface UpsertCourseReview {
  rating: number;
  reviewText: string;
}

export type CourseReviewPage = PageResponse<CourseReview>;
