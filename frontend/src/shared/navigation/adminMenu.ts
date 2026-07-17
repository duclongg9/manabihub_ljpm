import { ROLES } from '../constants/roles';
import { ROUTES } from '../constants/routes';
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import RuleIcon from '@mui/icons-material/Rule';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';

export const ADMIN_MENU = [
  {
    title: 'Dashboard',
    path: ROUTES.ADMIN.DASHBOARD,
    icon: SpaceDashboardIcon,
    roles: [ROLES.SYSTEM_ADMIN, ROLES.COURSE_MANAGER, ROLES.FINANCE_MANAGER],
  },
  {
    title: 'Teacher KYC Review',
    path: ROUTES.ADMIN.KYC_REVIEW,
    icon: FactCheckIcon,
    roles: [ROLES.COURSE_MANAGER],
  },
  {
    title: 'Task Queue',
    path: ROUTES.ADMIN.TASK_QUEUE,
    icon: FormatListBulletedIcon,
    roles: [ROLES.COURSE_MANAGER],
  },
  {
    title: 'Course Approval',
    path: ROUTES.ADMIN.COURSE_APPROVAL,
    icon: RuleIcon,
    roles: [ROLES.COURSE_MANAGER],
  },
];
