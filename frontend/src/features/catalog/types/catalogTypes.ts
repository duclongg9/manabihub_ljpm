// ─── Paginated Response ───────────────────────────────────────────

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

// ─── Public Course Summary (catalog list item) ───────────────────

export interface PublicCourseSummary {
  id: string;
  title: string;
  slug: string;
  thumbnailUrl?: string;
  jlptLevel?: string;
  category?: string;
  price: number;
  currency: string;
  teacherName?: string;
  teacherAvatarUrl?: string;
  averageRating: number;
  totalReviews: number;
  totalLessons: number;
  publishedAt?: string;
}

// ─── Catalog Filter Params ───────────────────────────────────────

export interface CourseCatalogFilters {
  keyword?: string;
  category?: string;
  jlptLevel?: string;
  minPrice?: number;
  maxPrice?: number;
}

export type CourseCatalogParams = CourseCatalogFilters & {
  page?: number;
  size?: number;
  sort?: string;
};

// ─── Course Category (from /v1/course-categories) ────────────────

export interface CourseCategory {
  id: string;
  code: string;
  name: string;
  description?: string;
}
