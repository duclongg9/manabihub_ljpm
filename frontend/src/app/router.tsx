import { createBrowserRouter } from 'react-router-dom';
import { PublicLayout } from '../shared/layouts/PublicLayout';
import { StudentLayout } from '../shared/layouts/StudentLayout';
import { TeacherLayout } from '../shared/layouts/TeacherLayout';
import { AdminLayout } from '../shared/layouts/AdminLayout';
import { TeacherKycRoute } from '../features/kyc/TeacherKycRoute';
import { KycQueuePage } from '../features/admin-kyc/pages/KycQueuePage';
import { KycDetailPage } from '../features/admin-kyc/pages/KycDetailPage';


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
        path: 'kyc',
        element: <KycQueuePage />,
      },
      {
        path: 'kyc/:id',
        element: <KycDetailPage />,
      },
    ],
  },
]);
