import { ROUTES } from '../constants/routes';
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import WalletIcon from '@mui/icons-material/Wallet';

export const TEACHER_MENU = [
  {
    title: 'Tổng quan',
    path: ROUTES.TEACHER.DASHBOARD,
    icon: SpaceDashboardIcon,
  },
  {
    title: 'Khóa học của tôi',
    path: ROUTES.TEACHER.COURSES,
    icon: MenuBookIcon,
  },
  {
    title: 'Xác minh giáo viên',
    path: ROUTES.TEACHER.KYC,
    icon: VerifiedUserIcon,
  },
  {
    title: 'Ví & Thanh toán',
    path: ROUTES.TEACHER.WALLET,
    icon: WalletIcon,
  },
];
