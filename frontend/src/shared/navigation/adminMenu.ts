import { ROLES } from '../constants/roles';
import { ROUTES } from '../constants/routes';
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import RuleIcon from '@mui/icons-material/Rule';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import SettingsApplicationsOutlinedIcon from '@mui/icons-material/SettingsApplicationsOutlined';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';

export const ADMIN_MENU = [
  {
    title: 'Dashboard',
    path: ROUTES.ADMIN.DASHBOARD,
    icon: SpaceDashboardIcon,
    roles: [ROLES.SYSTEM_ADMIN, ROLES.COURSE_MANAGER, ROLES.FINANCE_MANAGER],
  },
  {
    title: 'Cấu hình hệ thống',
    path: ROUTES.ADMIN.SYSTEM_SETTINGS,
    icon: SettingsApplicationsOutlinedIcon,
    roles: [ROLES.SYSTEM_ADMIN],
  },
  {
    title: 'Phân quyền nội bộ',
    path: ROUTES.ADMIN.USERS,
    icon: ManageAccountsOutlinedIcon,
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
    title: 'Payout Settlement',
    path: ROUTES.ADMIN.PAYOUTS,
    icon: AccountBalanceOutlinedIcon,
    roles: [ROLES.FINANCE_MANAGER],
  },
];
