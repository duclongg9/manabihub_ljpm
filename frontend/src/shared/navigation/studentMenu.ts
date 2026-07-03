import { ROUTES } from '../constants/routes';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';

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
];
