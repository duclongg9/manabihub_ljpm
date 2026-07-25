import { ROUTES } from '../constants/routes';
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

export const STUDENT_MENU = [
  {
    title: 'My Learning',
    path: ROUTES.STUDENT.DASHBOARD,
    icon: SpaceDashboardIcon,
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
