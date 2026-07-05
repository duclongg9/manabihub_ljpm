import { ROUTES } from '../constants/routes';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

export const STUDENT_MENU = [
  {
    title: 'My Learning',
    path: ROUTES.STUDENT.DASHBOARD,
    icon: DashboardIcon,
  },
  {
    title: 'Browse Courses',
    path: ROUTES.PUBLIC.COURSE_BROWSE,
    icon: LibraryBooksIcon,
  },
  {
    title: 'Purchase History',
    path: ROUTES.STUDENT.PAYMENTS,
    icon: ReceiptLongIcon,
  },
  {
    title: "Manage Profile",
    path: ROUTES.STUDENT.PROFILE,
    icon: AccountCircleIcon,
  },
];
