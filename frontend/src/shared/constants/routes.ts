export const ROUTES = {
  PUBLIC: {
    HOME: '/',
    LOGIN: '/login',
    REGISTER: '/register',
    COURSE_BROWSE: '/courses',
  },
  STUDENT: {
    DASHBOARD: '/student/dashboard',
    MY_COURSES: '/student/courses',
    PAYMENTS: '/student/payments',
    NOTIFICATIONS: '/student/notifications',
    PROFILE: '/student/profile',
  },
  TEACHER: {
    DASHBOARD: '/teacher/dashboard',
    COURSES: '/teacher/courses',
    COURSE_CREATE: '/teacher/courses/new',
    COURSE_BUILDER: (draftId: string) => `/teacher/courses/${draftId}/builder`,
    KYC: '/teacher/kyc',
    WALLET: '/teacher/wallet',
    NOTIFICATIONS: '/teacher/notifications',
    PROFILE: '/teacher/profile',
  },
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    SYSTEM_SETTINGS: '/admin/settings',
    USERS: '/admin/users',
    COURSE_APPROVAL: '/admin/courses/approvals',
    KYC_REVIEW: '/admin/kyc',
    FINANCE: '/admin/finance',
    NOTIFICATIONS: '/admin/notifications',
  },
};
