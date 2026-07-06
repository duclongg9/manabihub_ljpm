import { createBrowserRouter } from 'react-router-dom';
import { PublicLayout } from '../shared/layouts/PublicLayout';
import { StudentLayout } from '../shared/layouts/StudentLayout';
import { TeacherLayout } from '../shared/layouts/TeacherLayout';
import { AdminLayout } from '../shared/layouts/AdminLayout';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { StudentOnboardingPage } from './pages/StudentOnboardingPage';
import { PublicLoginPage } from './pages/PublicLoginPage';
import { AdminLoginPage } from './pages/AdminLoginPage';

export const router = createBrowserRouter([
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
        index: true,
        element: <div>Home Page Placeholder</div>,
      },
      {
        path: 'auth/callback',
        element: <AuthCallbackPage />,
      },
      {
        path: 'onboarding/student',
        element: <StudentOnboardingPage />,
      },
    ],
  },
  {
    path: '/student',
    element: <StudentLayout />,
    children: [
      {
        index: true,
        element: <div>Student Dashboard Placeholder</div>,
      },
    ],
  },
  {
    path: '/teacher',
    element: <TeacherLayout />,
    children: [
      {
        index: true,
        element: <div>Teacher Dashboard Placeholder</div>,
      },
    ],
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      {
        index: true,
        element: <div>Admin Dashboard Placeholder</div>,
      },
    ],
  },
]);
