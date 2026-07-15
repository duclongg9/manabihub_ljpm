import { createBrowserRouter, Navigate } from 'react-router-dom';
import { PublicLayout } from '../shared/layouts/PublicLayout';
import { StudentLayout } from '../shared/layouts/StudentLayout';
import { TeacherLayout } from '../shared/layouts/TeacherLayout';
import { AdminLayout } from '../shared/layouts/AdminLayout';
import { NotificationsPage } from '../features/notifications/pages/NotificationsPage';
import { TeacherKycRoute } from '../features/kyc/TeacherKycRoute';
import { KycQueuePage } from '../features/admin-kyc/pages/KycQueuePage';
import { KycDetailPage } from '../features/admin-kyc/pages/KycDetailPage';
import StudentProfilePage from '../features/profile/StudentProfilePage';
import TeacherProfilePage from '../features/profile/TeacherProfilePage';
import { CourseDraftPage } from '../features/course-builder/pages/CourseDraftPage';
import { TeacherCoursesPage } from '../features/course-builder/pages/TeacherCoursesPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { StudentOnboardingPage } from './pages/StudentOnboardingPage';
import { PublicLoginPage } from './pages/PublicLoginPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { PublicHomePage } from './pages/PublicHomePage/PublicHomePage';
import { AboutUsPage } from './pages/PublicHomePage/AboutUsPage';

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
    path: '/',
    element: <PublicLayout />,
    children: [
      {
        path: 'auth/callback',
        element: <AuthCallbackPage />,
      },
      {
        path: 'onboarding/student',
        element: <StudentOnboardingPage />,
      },
      {
        path: 'courses',
        element: <div>Course Catalog Placeholder</div>,
      },
      {
        path: 'courses/:id',
        element: <div>Course Detail Placeholder</div>,
      },
      {
        path: 'register',
        element: <div>Register Page Placeholder</div>,
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
        element: <div>Student Dashboard Placeholder</div>,
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
        element: <div>Student Courses Placeholder</div>,
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
        element: <div>Teacher Dashboard Placeholder</div>,
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
        element: <div>Teacher Wallet Placeholder</div>,
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
        element: <div>Admin Dashboard Placeholder</div>,
      },
      {
        path: 'notifications',
        element: <NotificationsPage />,
      },
      {
        path: 'settings',
        element: <div>System Settings Placeholder</div>,
      },
      {
        path: 'users',
        element: <div>User Management Placeholder</div>,
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
        path: 'courses/approvals',
        element: <div>Course Approval Placeholder</div>,
      },
      {
        path: 'finance',
        element: <div>Finance Placeholder</div>,
      },
    ],
  },
]);
