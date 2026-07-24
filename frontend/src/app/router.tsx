import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import { PublicLayout } from '../shared/layouts/PublicLayout';
import { StudentLayout } from '../shared/layouts/StudentLayout';
import { TeacherLayout } from '../shared/layouts/TeacherLayout';
import { AdminLayout } from '../shared/layouts/AdminLayout';
import { NotificationsPage } from '../features/notifications/pages/NotificationsPage';
import { TeacherKycRoute } from '../features/kyc/TeacherKycRoute';
import { KycQueuePage } from '../features/admin-kyc/pages/KycQueuePage';
import { KycDetailPage } from '../features/admin-kyc/pages/KycDetailPage';
import { StudentDashboardPage } from '../features/student/pages/StudentDashboardPage';
import { StudentCoursesPage } from '../features/student/pages/StudentCoursesPage';
import StudentProfilePage from '../features/profile/StudentProfilePage';
import TeacherProfilePage from '../features/profile/TeacherProfilePage';
import { CourseBuilderPage } from '../features/course-builder/pages/CourseBuilderPage';
import { CourseDraftPage } from '../features/course-builder/pages/CourseDraftPage';
import { TeacherCoursesPage } from '../features/course-builder/pages/TeacherCoursesPage';
import { CourseApprovalQueuePage } from '../features/admin-course-approval/pages/CourseApprovalQueuePage';
import { CourseApprovalDetailPage } from '../features/admin-course-approval/pages/CourseApprovalDetailPage';
import { FinalTestConfigPage } from '../features/course-builder/pages/FinalTestConfigPage';
import { CourseDetailPage } from '../features/catalog/pages/CourseDetailPage';
import { CourseLearningPage } from '../features/learning/pages/CourseLearningPage';
import { CourseCatalogPage } from '../features/catalog/pages/CourseCatalogPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { StudentOnboardingPage } from './pages/StudentOnboardingPage';
import { PublicLoginPage } from './pages/PublicLoginPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { PublicHomePage } from './pages/PublicHomePage/PublicHomePage';
import { AboutUsPage } from './pages/PublicHomePage/AboutUsPage';
import { TeacherDashboardPage } from '../features/teacher/pages/TeacherDashboardPage';
import { AdminDashboardPage } from '../features/admin/pages/AdminDashboardPage';
import { TeacherWritingReviewsPage } from '../features/writing-review/pages/TeacherWritingReviewsPage';
import { TeacherWritingReviewDetailPage } from '../features/writing-review/pages/TeacherWritingReviewDetailPage';
import { StudentAiChatPage } from '../features/ai-chat/pages/StudentAiChatPage';
import { StudentWishlistPage } from '../features/wishlist/pages/StudentWishlistPage';

export const router = createBrowserRouter([
  {
    path: '/',
    index: true,
    element: <PublicHomePage />,
  },
  {
    path: '/login',
    element: <PublicLoginPage />,
  },
  {
    path: '/admin/login',
    element: <AdminLoginPage />,
  },
  {
    path: '/onboarding/student',
    element: <StudentOnboardingPage />,
  },
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      {
        path: 'auth/callback',
        element: <AuthCallbackPage />,
      },
      {
        path: 'courses',
        element: <CourseCatalogPage />,
      },
      {
        path: 'courses/:id',
        element: <CourseDetailPage />,
      },
      {
        path: 'register',
        element: <Navigate to="/login" replace />,
      },
      {
        path: 'about',
        element: <AboutUsPage />,
      },
    ],
  },
  {
    path: '/student',
    element: <StudentLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/student/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <StudentDashboardPage />,
      },
      {
        path: 'profile',
        element: <StudentProfilePage />,
      },
      {
        path: 'notifications',
        element: <NotificationsPage />,
      },
      {
        path: 'payments',
        element: <div>Student Payments Placeholder</div>,
      },
      {
        path: 'courses',
        element: <StudentCoursesPage />,
      },
      {
        path: 'wishlist',
        element: <StudentWishlistPage />,
      },
      {
        path: 'courses/:courseId/learn',
        element: <CourseLearningPage />,
      },
      {
        path: 'courses/:courseId/lesson-blocks/:lessonBlockId/ai-chat',
        element: <StudentAiChatPage />,
      },
    ],
  },
  {
    path: '/teacher',
    element: <TeacherLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/teacher/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <TeacherDashboardPage />,
      },
      {
        path: 'courses',
        element: <TeacherCoursesPage />,
      },
      {
        path: 'courses/new',
        element: <CourseDraftPage />,
      },
      {
        path: 'courses/:draftId/builder',
        element: <CourseBuilderPage />,
      },
      {
        path: 'courses/:courseId/final-test',
        element: <FinalTestConfigPage />,
      },
      {
        path: 'writing-reviews',
        element: <TeacherWritingReviewsPage />,
      },
      {
        path: 'writing-reviews/:submissionId',
        element: <TeacherWritingReviewDetailPage />,
      },
      {
        path: 'profile',
        element: <TeacherProfilePage />,
      },
      {
        path: 'notifications',
        element: <NotificationsPage />,
      },
      {
        path: 'kyc',
        element: <TeacherKycRoute />,
      },
      {
        path: 'wallet',
        element: <Navigate to="/teacher/dashboard" replace />,
      },
    ],
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/admin/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <AdminDashboardPage />,
      },
      {
        path: 'notifications',
        element: <NotificationsPage />,
      },
      {
        path: 'settings',
        element: <Navigate to="/admin/dashboard" replace />,
      },
      {
        path: 'users',
        element: <Navigate to="/admin/dashboard" replace />,
      },
      {
        path: 'kyc/review',
        element: <Navigate to="/admin/kyc" replace />,
      },
      {
        path: 'kyc',
        element: <KycQueuePage />,
      },
      {
        path: 'kyc/:id',
        element: <KycDetailPage />,
      },
      {
        path: 'tasks/queue',
        element: <CourseApprovalQueuePage />,
      },
      {
        path: 'courses/approvals',
        element: <Box sx={{ p: 4, mt: 4, textAlign: 'center', color: 'text.secondary' }}><Typography variant="h5">Vui lòng chọn một khóa học từ Task Queue để tiến hành phê duyệt.</Typography></Box>,
      },
      {
        path: 'courses/approvals/:id',
        element: <CourseApprovalDetailPage />,
      },
      {
        path: 'finance',
        element: <Navigate to="/admin/dashboard" replace />,
      },
    ],
  },
]);
