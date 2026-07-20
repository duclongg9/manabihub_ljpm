export const ENDPOINTS = {
  NOTIFICATIONS: {
    LIST: '/v1/notifications',
    UNREAD_COUNT: '/v1/notifications/unread-count',
    MARK_READ: (id: string) => `/v1/notifications/${id}/read`,
    MARK_ALL_READ: '/v1/notifications/read-all',
  },
  ADMIN_KYC: {
    QUEUE: '/v1/admin/kyc-requests',
    DETAIL: (id: string) => `/v1/admin/kyc-requests/${id}`,
    REVIEW: (id: string) => `/v1/admin/kyc-requests/${id}/review`,
  },
  ADMIN_COURSE_APPROVAL: {
    QUEUE: '/v1/admin/course-approvals',
    DETAIL: (id: string) => `/v1/admin/course-approvals/${id}`,
    REVIEW: (id: string) => `/v1/admin/course-approvals/${id}/review`,
  },
  teacherKyc: {
    status: '/v1/teacher/kyc/status',
    identityVerifications: '/v1/teacher/kyc/identity-verifications',
    restartVerification: '/v1/teacher/kyc/restart-verification',
    certificateSubmissions: '/v1/teacher/kyc/certificate-submissions',
  },
  profile: {
    student: '/v1/student/profile',
    teacher: '/v1/teacher/profile',
  },
  teacherDashboard: {
    stats: '/v1/teacher/dashboard',
  },
  teacherWriting: {
    submissions: '/v1/teacher/writing-submissions',
    detail: (submissionId: string) => `/v1/teacher/writing-submissions/${submissionId}`,
    feedback: (submissionId: string) => `/v1/teacher/writing-submissions/${submissionId}/feedback`,
  },
  student: {
    dashboardStats: '/v1/student/dashboard/stats',
    courses: '/v1/student/courses',
  },
  teacherCourses: {
    drafts: '/v1/teacher/courses/drafts',
    draftDetail: (id: string) => `/v1/teacher/courses/drafts/${id}`,
    builder: (id: string) => `/v1/teacher/courses/drafts/${id}/builder`,
    builderModules: (id: string) => `/v1/teacher/courses/drafts/${id}/builder/modules`,
    builderModuleDetail: (id: string, moduleId: string) => `/v1/teacher/courses/drafts/${id}/builder/modules/${moduleId}`,
    builderModuleOrder: (id: string) => `/v1/teacher/courses/drafts/${id}/builder/modules/order`,
    builderBlocks: (id: string, moduleId: string) => `/v1/teacher/courses/drafts/${id}/builder/modules/${moduleId}/blocks`,
    builderBlockDetail: (id: string, moduleId: string, blockId: string) => `/v1/teacher/courses/drafts/${id}/builder/modules/${moduleId}/blocks/${blockId}`,
    builderBlockOrder: (id: string, moduleId: string) => `/v1/teacher/courses/drafts/${id}/builder/modules/${moduleId}/blocks/order`,
    validate: (id: string) => `/v1/teacher/courses/drafts/${id}/validate`,
    submitReview: (id: string) => `/v1/teacher/courses/drafts/${id}/submit-review`
  },
  teacherCourseAssets: {
    thumbnails: '/v1/teacher/courses/assets/thumbnails',
  },
  courseCategories: {
    list: '/v1/course-categories',
  },
  publicCourses: {
    list: '/v1/public/courses',
  },
  ADMIN_LOGIN: '/admin/auth/login',
  FLASHCARD: {
    GET: (lessonBlockId: string) =>
        `/student/flashcards/${lessonBlockId}`,

    REVIEW:
        "/student/flashcards/review",

    SUMMARY: (lessonBlockId: string) =>
        `/student/flashcards/${lessonBlockId}/summary`,
  },
};
