import { ROUTES } from '../constants/routes';
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

export const STUDENT_MENU = [
  {
    title: 'Khóa học của tôi',
    path: ROUTES.STUDENT.DASHBOARD,
    icon: SpaceDashboardIcon,
  },
  {
    title: 'Khám phá khóa học',
    path: ROUTES.STUDENT.BROWSE_COURSES,
    icon: LibraryBooksIcon,
  },
  {
    title: 'Danh sách yêu thích',
    path: ROUTES.STUDENT.WISHLIST,
    icon: FavoriteBorderIcon,
  },
  {
    title: 'Ví & Thanh toán',
    path: ROUTES.STUDENT.PAYMENTS,
    icon: AccountBalanceWalletIcon,
  },
  {
    title: 'Hồ sơ cá nhân',
    path: ROUTES.STUDENT.PROFILE,
    icon: AccountCircleIcon,
  },
];
