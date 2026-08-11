export interface StudentDashboardStats {
  totalEnrolledCourses: number;
  activeCourses: number;
  completedCourses: number;
}

export type EnrollmentStatus = 'ACTIVE' | 'REFUND_PENDING' | 'REFUNDED' | 'REVOKED' | 'COMPLETED' | 'EXPIRED';

export interface StudentCourseSummary {
  enrollmentId: string;
  courseId: string;
  courseTitle: string;
  thumbnailUrl: string | null;
  teacherName: string | null;
  enrollmentStatus: EnrollmentStatus;
  enrolledAt: string;
  expiresAt?: string | null;
  daysRemaining?: number;
  progressPercentage: number;
}
