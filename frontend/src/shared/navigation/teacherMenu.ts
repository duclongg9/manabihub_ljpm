import { ROUTES } from '../constants/routes';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

export const TEACHER_MENU = [
  {
    title: 'Dashboard',
    path: ROUTES.TEACHER.DASHBOARD,
    icon: DashboardIcon,
  },
  {
    title: 'My Courses',
    path: ROUTES.TEACHER.COURSES,
    icon: MenuBookIcon,
  },
  {
    title: 'KYC Verification',
    path: ROUTES.TEACHER.KYC,
    icon: VerifiedUserIcon,
  },
  {
    title: 'Wallet & Payouts',
    path: ROUTES.TEACHER.WALLET,
    icon: AccountBalanceWalletIcon,
  },
  {
    title: "Manage Profile",
    path: ROUTES.TEACHER.PROFILE,
    icon: AccountCircleIcon,
  },
];
