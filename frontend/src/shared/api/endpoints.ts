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
    wishlist: '/v1/student/wishlist',
    wishlistCourse: (courseId: string) => `/v1/student/wishlist/${courseId}`,
  },
  studentAiChat: {
    eligibility: (courseId: string, lessonBlockId: string) =>
      `/v1/student/courses/${courseId}/lesson-blocks/${lessonBlockId}/ai-chat/eligibility`,
    messages: (courseId: string, lessonBlockId: string) =>
      `/v1/student/courses/${courseId}/lesson-blocks/${lessonBlockId}/ai-chat/messages`,
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
  LEARNING: {
    COURSE_LEARN: (courseId: string) => `/v1/student/courses/${courseId}/learn`,
    COURSE_PROGRESS: (courseId: string) => `/v1/student/courses/${courseId}/progress`,
    VIDEO_PROGRESS: (blockId: string) => `/v1/student/lessons/${blockId}/video-progress`,
    MARK_COMPLETE: (blockId: string) => `/v1/student/lessons/${blockId}/complete`,
    FLASHCARD_REVIEW: (blockId: string) => `/v1/student/lessons/${blockId}/flashcards/review`,
    QUIZ_SUBMIT: (blockId: string) => `/v1/student/lessons/${blockId}/quiz-submissions`,
    FINAL_TEST_ELIGIBILITY: (courseId: string) => `/v1/student/courses/${courseId}/final-test/eligibility`,
    FINAL_TEST_START: (courseId: string) => `/v1/student/courses/${courseId}/final-test/attempts`,
    FINAL_TEST_SUBMIT: (courseId: string) => `/v1/student/courses/${courseId}/final-test/submissions`,
    CERTIFICATE: (courseId: string) => `/v1/student/courses/${courseId}/certificate`,
    WRITING_SUBMISSION_GET: (blockId: string) => `/v1/student/lessons/${blockId}/writing-submissions/me`,
    WRITING_SUBMISSION_POST: (blockId: string) => `/v1/student/lessons/${blockId}/writing-submissions`,
    WRITING_SUBMISSION_AI: (blockId: string, submissionId: string) => `/v1/student/lessons/${blockId}/writing-submissions/${submissionId}/ai-assistance`,
  },
  // UC-17 Manage My Wallet. Student and Teacher have separate paths because
  // the backend enforces the role at the endpoint level (BR-RBAC-01).
  wallet: {
    studentWallet: '/v1/student/wallet',
    studentTransactions: '/v1/student/wallet/transactions',
    studentTopUps: '/v1/student/wallet/top-ups',
    teacherWallet: '/v1/teacher/wallet',
    teacherTransactions: '/v1/teacher/wallet/transactions',
    teacherWithdrawals: '/v1/teacher/wallet/withdrawals',
  },
  ADMIN_LOGIN: '/admin/auth/login',
};
