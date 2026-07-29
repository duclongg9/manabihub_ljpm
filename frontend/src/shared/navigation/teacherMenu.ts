import { ROUTES } from '../constants/routes';
import { ROLES } from '../constants/roles';
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

export const TEACHER_MENU = [
  {
    title: 'Tổng quan',
    path: ROUTES.TEACHER.DASHBOARD,
    icon: SpaceDashboardIcon,
    roles: [ROLES.TEACHER],
  },
  {
    title: 'Khóa học của tôi',
    path: ROUTES.TEACHER.COURSES,
    icon: MenuBookIcon,
    roles: [ROLES.TEACHER],
  },
  {
    title: 'Phản hồi bài viết',
    path: ROUTES.TEACHER.WRITING_REVIEWS,
    icon: RateReviewOutlinedIcon,
    roles: [ROLES.TEACHER],
  },
  {
    title: 'Xác minh giáo viên',
    path: ROUTES.TEACHER.KYC,
    icon: VerifiedUserIcon,
    roles: [ROLES.STUDENT, ROLES.TEACHER],
  },
  {
    title: 'Ví của tôi',
    path: ROUTES.TEACHER.WALLET,
    icon: AccountBalanceWalletIcon,
    roles: [ROLES.TEACHER],
  },
  {
    title: 'Hồ sơ',
    path: ROUTES.TEACHER.PROFILE,
    icon: AccountCircleIcon,
    roles: [ROLES.TEACHER],
  },
];
