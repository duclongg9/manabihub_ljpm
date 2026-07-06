import { createBrowserRouter, Navigate } from 'react-router-dom';
import { PublicLayout } from '../shared/layouts/PublicLayout';
import { StudentLayout } from '../shared/layouts/StudentLayout';
import { TeacherLayout } from '../shared/layouts/TeacherLayout';
import { AdminLayout } from '../shared/layouts/AdminLayout';
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
        path: 'courses',
        element: <div>Course Catalog Placeholder</div>,
      },
      {
        path: 'login',
        element: <div>Login Page Placeholder</div>,
      },
      {
        path: 'register',
        element: <div>Register Page Placeholder</div>,
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
        element: <div>Teacher Courses Placeholder</div>,
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
        path: 'settings',
        element: <div>System Settings Placeholder</div>,
      },
      {
        path: 'users',
        element: <div>User Management Placeholder</div>,
      },
      {
        path: 'kyc/review',
        element: <div>Teacher KYC Review Placeholder</div>,
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
