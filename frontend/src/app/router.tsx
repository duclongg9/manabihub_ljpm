import {createBrowserRouter} from 'react-router-dom';
import {PublicLayout} from '../shared/layouts/PublicLayout';
import {StudentLayout} from '../shared/layouts/StudentLayout';
import {TeacherLayout} from '../shared/layouts/TeacherLayout';
import {AdminLayout} from '../shared/layouts/AdminLayout';
import {TeacherKycPage} from '../features/kyc/TeacherKycPage';
import StudentProfilePage from "../features/profile/StudentProfilePage";
import TeacherProfilePage from "../features/profile/TeacherProfilePage";

export const router = createBrowserRouter([
    {
        path: '/',
        element: <PublicLayout/>,
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
        element: <StudentLayout/>,
        children: [
            {
                index: true,
                element: <div>Student Dashboard Placeholder</div>,
            },
            {
                path: "profile",
                element: <StudentProfilePage/>,
            },
        ],
    },
    {
        path: '/teacher',
        element: <TeacherLayout/>,
        children: [
            {
                index: true,
                element: <TeacherKycPage/>,
            },
            {
                path: 'kyc',
                element: <TeacherKycPage/>,
            },
            {
                path: "profile",
                element: <TeacherProfilePage/>,
            },
        ],
    },
    {
        path: '/admin',
        element: <AdminLayout/>,
        children: [
            {
                index: true,
                element: <div>Admin Dashboard Placeholder</div>,
            },
        ],
    },

]);
