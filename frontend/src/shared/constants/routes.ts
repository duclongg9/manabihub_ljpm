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
    // UC04
    PROFILE: '/student/profile',
  },
  TEACHER: {
    DASHBOARD: '/teacher/dashboard',
    COURSES: '/teacher/courses',
    KYC: '/teacher/kyc',
    WALLET: '/teacher/wallet',
    // UC04
    PROFILE: '/teacher/profile',
  },
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    SYSTEM_SETTINGS: '/admin/settings',
    USERS: '/admin/users',
    COURSE_APPROVAL: '/admin/courses/approvals',
    KYC_REVIEW: '/admin/kyc/review',
    FINANCE: '/admin/finance',
  },
};
