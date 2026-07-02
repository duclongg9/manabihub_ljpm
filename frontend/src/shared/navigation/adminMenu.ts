import { ROLES } from '../constants/roles';
import { ROUTES } from '../constants/routes';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SettingsIcon from '@mui/icons-material/Settings';
import PeopleIcon from '@mui/icons-material/People';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import RuleIcon from '@mui/icons-material/Rule';

export const ADMIN_MENU = [
  {
    title: 'Dashboard',
    path: ROUTES.ADMIN.DASHBOARD,
    icon: DashboardIcon,
    roles: [ROLES.SYSTEM_ADMIN, ROLES.COURSE_MANAGER, ROLES.FINANCE_MANAGER],
  },
  {
    title: 'System Settings',
    path: ROUTES.ADMIN.SYSTEM_SETTINGS,
    icon: SettingsIcon,
    roles: [ROLES.SYSTEM_ADMIN],
  },
  {
    title: 'User Management',
    path: ROUTES.ADMIN.USERS,
    icon: PeopleIcon,
    roles: [ROLES.SYSTEM_ADMIN],
  },
  {
    title: 'Teacher KYC Review',
    path: ROUTES.ADMIN.KYC_REVIEW,
    icon: FactCheckIcon,
    roles: [ROLES.COURSE_MANAGER],
  },
  {
    title: 'Course Approval',
    path: ROUTES.ADMIN.COURSE_APPROVAL,
    icon: RuleIcon,
    roles: [ROLES.COURSE_MANAGER],
  },
  {
    title: 'Finance & Payouts',
    path: ROUTES.ADMIN.FINANCE,
    icon: AccountBalanceIcon,
    roles: [ROLES.FINANCE_MANAGER],
  },
];
