import React, { useState } from 'react';
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import ArrowForwardIosOutlinedIcon from '@mui/icons-material/ArrowForwardIosOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import PasswordIcon from '@mui/icons-material/Password';
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard';
import { Link, useNavigate } from 'react-router-dom';
import {
  clearAuthSession,
  getDefaultRoute,
  getLoginRoute,
  type AuthSession,
} from '../auth/authSession';
import { ROLES } from '../constants/roles';
import { ROUTES } from '../constants/routes';
import { logoutAdminSession } from '../auth/adminAuthApi';
import { getHeaderBrand } from './headerBrand';
import { useUnreadCount } from '../../features/notifications/hooks/useNotifications';
import { useQuery } from '@tanstack/react-query';
import { getStudentWallet } from '../../features/wallet/services/studentWalletService';
import { walletService } from '../../features/my-wallet/services/walletService';
import type { StudentWalletResponse } from '../../features/wallet/types';
import type { TeacherWallet } from '../../features/my-wallet/types/wallet.types';

interface HeaderProps {
  menuExpanded?: boolean;
  onMenuClick?: () => void;
  session?: AuthSession;
  showMenuIcon?: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  [ROLES.STUDENT]: 'Học viên',
  [ROLES.TEACHER]: 'Giảng viên',
  [ROLES.SYSTEM_ADMIN]: 'Quản trị hệ thống',
  [ROLES.COURSE_MANAGER]: 'Quản lý khóa học',
  [ROLES.FINANCE_MANAGER]: 'Quản lý tài chính',
};

export const Header: React.FC<HeaderProps> = ({
  menuExpanded = false,
  onMenuClick,
  session,
  showMenuIcon = false,
}) => {
  const navigate = useNavigate();
  const [accountAnchor, setAccountAnchor] = useState<HTMLElement | null>(null);
  const notificationPath = session ? getNotificationPath(session) : null;
  const profilePath = session ? getProfilePath(session) : null;
  const primaryRole = session?.roles[0];
  const avatarLabel = session?.email?.trim().charAt(0).toUpperCase() || 'U';
  const brandLabel = getHeaderBrand(session);
  const isAdminPortal = session?.kind === 'admin';
  const { data: unreadCount = 0 } = useUnreadCount(Boolean(session));
  const isStudentAccount = session?.kind === 'public' && primaryRole === ROLES.STUDENT;
  const isTeacherAccount = session?.kind === 'public' && primaryRole === ROLES.TEACHER;
  const studentWalletQuery = useQuery<StudentWalletResponse>({
    queryKey: ['account-menu-student-wallet'],
    queryFn: getStudentWallet,
    enabled: Boolean(accountAnchor) && isStudentAccount,
    staleTime: 60_000,
    retry: false,
  });
  const teacherWalletQuery = useQuery<TeacherWallet>({
    queryKey: ['account-menu-teacher-wallet'],
    queryFn: async () => (await walletService.getTeacherWallet()).data,
    enabled: Boolean(accountAnchor) && isTeacherAccount,
    staleTime: 60_000,
    retry: false,
  });

  const brandContent = (
    <>
      <Box
        component="img"
        src="/manabihub-header-logo.svg"
        alt="ManabiHub"
        sx={{ display: 'block', flexShrink: 0, height: { xs: 40, sm: 48 }, width: 'auto' }}
      />
      <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' }, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {brandLabel}
      </Box>
    </>
  );

  const handleLogout = async () => {
    if (!session) return;

    setAccountAnchor(null);
    if (session.kind === 'admin') {
      const serverSessionRevoked = await logoutAdminSession();
      navigate(
        serverSessionRevoked
          ? getLoginRoute(session.kind)
          : `${getLoginRoute(session.kind)}?reason=logout-local-only`,
        { replace: true },
      );
      return;
    } else {
      clearAuthSession(session.kind);
    }
    navigate(getLoginRoute(session.kind), { replace: true });
  };

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, bgcolor: 'background.paper', color: 'text.primary' }} elevation={1}>
      <Toolbar sx={{ minWidth: 0, px: { xs: 1.5, sm: 2 } }}>
        {showMenuIcon && onMenuClick && (
          <Tooltip title={menuExpanded ? 'Thu gọn menu' : 'Mở menu'}>
            <IconButton
              edge="start"
              color="inherit"
              aria-label={menuExpanded ? 'Thu gọn menu' : 'Mở menu'}
              aria-expanded={menuExpanded}
              onClick={onMenuClick}
              sx={{ mr: { xs: 0.5, sm: 2 } }}
            >
              <MenuIcon />
            </IconButton>
          </Tooltip>
        )}
        
        {isAdminPortal ? (
          <Typography variant="h6" component="div" aria-label="ManabiAdmin" sx={{ alignItems: 'center', display: 'flex', flexGrow: 1, flexShrink: 1, minWidth: 0, gap: 1, color: 'primary.main', fontWeight: 900, letterSpacing: '-0.5px' }}>
            {brandContent}
          </Typography>
        ) : (
          <Typography variant="h6" component={Link} to={ROUTES.PUBLIC.HOME} sx={{ alignItems: 'center', display: 'flex', flexGrow: 1, flexShrink: 1, minWidth: 0, gap: 1, textDecoration: 'none', color: 'primary.main', fontWeight: 900, letterSpacing: '-0.5px' }}>
            {brandContent}
          </Typography>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0, gap: { xs: 0.25, sm: 2 } }}>
          {!session && (
            <Button component={Link} to="/" color="inherit" sx={{ display: { xs: 'none', md: 'flex' }, textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}>
              Trang chủ
            </Button>
          )}

          {session && notificationPath ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Tooltip title="Thông báo">
                <IconButton color="inherit" aria-label="Mở thông báo" onClick={() => navigate(notificationPath)} sx={{ color: 'text.secondary' }}>
                  <Badge badgeContent={unreadCount} color="error" max={99}>
                    <NotificationsIcon />
                  </Badge>
                </IconButton>
              </Tooltip>
              <Button
                color="inherit"
                aria-label="Mở menu tài khoản"
                aria-controls={accountAnchor ? 'account-menu' : undefined}
                aria-haspopup="true"
                onClick={(event) => setAccountAnchor(event.currentTarget)}
                sx={{ textTransform: 'none', color: 'text.primary', borderRadius: 8, minWidth: { xs: 40, sm: 'auto' }, pl: { xs: 0.5, sm: 0.5 }, pr: { xs: 0.5, sm: 1.5 }, py: 0.5, '&:hover': { bgcolor: 'grey.100' } }}
              >
                <Avatar sx={{ bgcolor: '#C41E3A', width: 32, height: 32, mr: { xs: 0, sm: 1 }, fontSize: '0.875rem', fontWeight: 700 }}>{avatarLabel}</Avatar>
                <Typography variant="body2" sx={{ fontWeight: 600, display: { xs: 'none', sm: 'block' } }}>
                  {session.email?.split('@')[0] || 'Tài khoản'}
                </Typography>
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline-flex' }, ml: 0.5, fontSize: '0.7rem', color: 'grey.500' }}>▼</Box>
              </Button>
            </Box>
          ) : (
            <Button startIcon={<LoginIcon />} onClick={() => navigate(ROUTES.PUBLIC.LOGIN)} sx={{ fontWeight: 600 }}>
              Đăng nhập
            </Button>
          )}
        </Box>
      </Toolbar>
      {session && (
        <Menu
          id="account-menu"
          anchorEl={accountAnchor}
          open={Boolean(accountAnchor)}
          onClose={() => setAccountAnchor(null)}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        >
          <Box sx={{ maxWidth: 320, minWidth: 260, px: 2, py: 1.25 }}>
            <Typography noWrap variant="body2" sx={{ fontWeight: 700 }}>
              {session.email || `Tài khoản ${brandLabel}`}
            </Typography>
            <Typography color="text.secondary" variant="caption">
              {primaryRole ? ROLE_LABELS[primaryRole] || primaryRole : 'Tài khoản'}
            </Typography>
          </Box>
          <Divider />
          <MenuItem onClick={() => { setAccountAnchor(null); navigate(getDefaultRoute(session)); }}>
            <ListItemIcon><SpaceDashboardIcon fontSize="small" /></ListItemIcon>
            {getDashboardLabel(session)}
          </MenuItem>
          {isStudentAccount && (
            <AccountWalletSummary
              kind="student"
              loading={studentWalletQuery.isLoading}
              error={studentWalletQuery.isError}
              wallet={studentWalletQuery.data}
              onOpen={() => { setAccountAnchor(null); navigate(ROUTES.STUDENT.PAYMENTS); }}
            />
          )}
          {isTeacherAccount && (
            <AccountWalletSummary
              kind="teacher"
              loading={teacherWalletQuery.isLoading}
              error={teacherWalletQuery.isError}
              wallet={teacherWalletQuery.data}
              onOpen={() => { setAccountAnchor(null); navigate(ROUTES.TEACHER.WALLET); }}
            />
          )}
          {profilePath && (
            <MenuItem onClick={() => { setAccountAnchor(null); navigate(profilePath); }}>
              <ListItemIcon><AccountCircleIcon fontSize="small" /></ListItemIcon>
              Hồ sơ cá nhân
            </MenuItem>
          )}
          {session.kind === 'admin' && (
            <MenuItem onClick={() => {
              setAccountAnchor(null);
              navigate(ROUTES.ADMIN.CHANGE_PASSWORD);
            }}>
              <ListItemIcon><PasswordIcon fontSize="small" /></ListItemIcon>
              Đổi mật khẩu
            </MenuItem>
          )}
          <MenuItem onClick={() => void handleLogout()}>
            <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
            Đăng xuất
          </MenuItem>
        </Menu>
      )}
    </AppBar>
  );
};

type AccountWalletSummaryProps = {
  kind: 'student' | 'teacher';
  loading: boolean;
  error: boolean;
  wallet?: StudentWalletResponse | TeacherWallet;
  onOpen: () => void;
};

function AccountWalletSummary({ kind, loading, error, wallet, onOpen }: AccountWalletSummaryProps) {
  const isStudent = kind === 'student';
  const studentWallet = isStudent ? wallet as StudentWalletResponse | undefined : undefined;
  const teacherWallet = !isStudent ? wallet as TeacherWallet | undefined : undefined;
  const currency = (amount: number | undefined) => amount == null
    ? '—'
    : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount);

  return (
    <Box sx={{ px: 2, py: 1.25, bgcolor: '#F8FAFC' }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.75 }}>
        <AccountBalanceWalletOutlinedIcon fontSize="small" sx={{ color: '#C41E3A' }} />
        <Typography variant="caption" sx={{ fontWeight: 800, color: '#475467' }}>
          {isStudent ? 'Ví & Thanh toán' : 'Ví doanh thu'}
        </Typography>
      </Stack>
      {loading ? (
        <Typography variant="caption" color="text.secondary">Đang cập nhật số dư…</Typography>
      ) : error ? (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
          Chưa tải được số dư. Mở ví để thử lại.
        </Typography>
      ) : (
        <Stack direction="row" spacing={2} sx={{ mb: 0.75 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {isStudent ? 'Số dư mua khóa học' : 'Số dư khả dụng'}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 800 }}>
              {currency(isStudent ? studentWallet?.availableBalance : teacherWallet?.availableBalance)}
            </Typography>
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {isStudent ? 'Có thể rút' : 'Đang đối soát'}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 800 }}>
              {currency(isStudent ? studentWallet?.availableWithdrawableBalance : teacherWallet?.pendingBalance)}
            </Typography>
          </Box>
        </Stack>
      )}
      <Button
        size="small"
        onClick={onOpen}
        endIcon={<ArrowForwardIosOutlinedIcon sx={{ fontSize: '0.75rem !important' }} />}
        sx={{ p: 0, minWidth: 0, textTransform: 'none', fontWeight: 800, color: '#C41E3A' }}
      >
        {isStudent ? 'Mở Ví & Thanh toán' : 'Mở ví doanh thu'}
      </Button>
    </Box>
  );
}

function getNotificationPath(session: AuthSession) {
  if (session.kind === 'admin') return ROUTES.ADMIN.NOTIFICATIONS;
  if (session.roles.includes(ROLES.TEACHER)) return ROUTES.TEACHER.NOTIFICATIONS;
  return ROUTES.STUDENT.NOTIFICATIONS;
}

function getProfilePath(session: AuthSession) {
  if (session.kind === 'admin') return null;
  if (session.roles.includes(ROLES.TEACHER)) return ROUTES.TEACHER.PROFILE;
  return ROUTES.STUDENT.PROFILE;
}

function getDashboardLabel(session: AuthSession) {
  if (session.kind === 'admin') return 'Tổng quan quản trị';
  if (session.roles.includes(ROLES.TEACHER)) return 'Tổng quan giảng viên';
  return 'Khóa học của tôi';
}
