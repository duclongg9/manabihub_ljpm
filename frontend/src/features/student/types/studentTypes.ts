export interface StudentDashboardStats {
  totalEnrolledCourses: number;
  activeCourses: number;
  completedCourses: number;
}

export type EnrollmentStatus = 'ACTIVE' | 'REFUNDED' | 'REVOKED' | 'COMPLETED';

export interface StudentCourseSummary {
  enrollmentId: string;
  courseId: string;
  courseTitle: string;
  thumbnailUrl: string | null;
  teacherName: string | null;
  enrollmentStatus: EnrollmentStatus;
  enrolledAt: string;
  progressPercentage: number;
}
