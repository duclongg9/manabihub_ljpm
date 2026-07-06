import { createBrowserRouter } from 'react-router-dom';
import { PublicLayout } from '../shared/layouts/PublicLayout';
import { StudentLayout } from '../shared/layouts/StudentLayout';
import { TeacherLayout } from '../shared/layouts/TeacherLayout';
import { AdminLayout } from '../shared/layouts/AdminLayout';
import { NotificationsPage } from '../features/notifications/pages/NotificationsPage';
import { TeacherKycRoute } from '../features/kyc/TeacherKycRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      {
        index: true,
        element: <div>Home Page Placeholder</div>,
      },
      {
        path: 'login',
        element: <div>Login Page Placeholder</div>,
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
      {
        path: 'notifications',
        element: <NotificationsPage />,
      },
    ],
  },
  {
    path: '/teacher',
    element: <TeacherLayout />,
    children: [
      {
        index: true,
        element: <TeacherKycRoute />,
      },
      {
        path: 'notifications',
        element: <NotificationsPage />,
      },
      {
        path: 'kyc',
        element: <TeacherKycRoute />,
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
      {
        path: 'notifications',
        element: <NotificationsPage />,
      },
    ],
  },
]);
