import { ROUTES } from '../constants/routes';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

export const TEACHER_MENU = [
  {
    title: 'Tổng quan',
    path: ROUTES.TEACHER.DASHBOARD,
    icon: DashboardIcon,
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
    icon: AccountBalanceWalletIcon,
  },
];
