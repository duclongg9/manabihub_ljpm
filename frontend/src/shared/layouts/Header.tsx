import React, { useState } from 'react';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
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

  const handleLogout = () => {
    if (!session) return;

    setAccountAnchor(null);
    clearAuthSession(session.kind);
    navigate(getLoginRoute(session.kind), { replace: true });
  };

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, bgcolor: 'background.paper', color: 'text.primary' }} elevation={1}>
      <Toolbar>
        {showMenuIcon && onMenuClick && (
          <Tooltip title={menuExpanded ? 'Thu gọn menu' : 'Mở menu'}>
            <IconButton
              edge="start"
              color="inherit"
              aria-label={menuExpanded ? 'Thu gọn menu' : 'Mở menu'}
              aria-expanded={menuExpanded}
              onClick={onMenuClick}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          </Tooltip>
        )}
        
        <Typography variant="h6" component={Link} to="/" sx={{ flexGrow: 1, textDecoration: 'none', color: 'primary.main', fontWeight: 900, letterSpacing: '-0.5px' }}>
          ManabiHub
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 2 } }}>
          <Button component={Link} to="/" color="inherit" sx={{ display: { xs: 'none', md: 'flex' }, textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}>
            Trang chủ
          </Button>

          {session && notificationPath ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Tooltip title="Thông báo">
                <IconButton color="inherit" aria-label="Mở thông báo" onClick={() => navigate(notificationPath)} sx={{ color: 'text.secondary' }}>
                  <NotificationsIcon />
                </IconButton>
              </Tooltip>
              <Button
                color="inherit"
                aria-label="Mở menu tài khoản"
                aria-controls={accountAnchor ? 'account-menu' : undefined}
                aria-haspopup="true"
                onClick={(event) => setAccountAnchor(event.currentTarget)}
                sx={{ textTransform: 'none', color: 'text.primary', borderRadius: 8, pl: 0.5, pr: 1.5, py: 0.5, '&:hover': { bgcolor: 'grey.100' } }}
              >
                <Avatar sx={{ bgcolor: '#C41E3A', width: 32, height: 32, mr: 1, fontSize: '0.875rem', fontWeight: 700 }}>{avatarLabel}</Avatar>
                <Typography variant="body2" sx={{ fontWeight: 600, display: { xs: 'none', sm: 'block' } }}>
                  {session.email?.split('@')[0] || 'Tài khoản'}
                </Typography>
                <Box component="span" sx={{ display: 'inline-flex', ml: 0.5, fontSize: '0.7rem', color: 'grey.500' }}>▼</Box>
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
          <Box sx={{ maxWidth: 260, minWidth: 220, px: 2, py: 1 }}>
            <Typography noWrap variant="body2" sx={{ fontWeight: 700 }}>
              {session.email || 'Tài khoản ManabiHub'}
            </Typography>
            <Typography color="text.secondary" variant="caption">
              {primaryRole ? ROLE_LABELS[primaryRole] || primaryRole : 'Tài khoản'}
            </Typography>
          </Box>
          <Divider />
          <MenuItem onClick={() => { setAccountAnchor(null); navigate(getDefaultRoute(session)); }}>
            <ListItemIcon><SpaceDashboardIcon fontSize="small" /></ListItemIcon>
            Bảng điều khiển
          </MenuItem>
          {profilePath && (
            <MenuItem onClick={() => { setAccountAnchor(null); navigate(profilePath); }}>
              <ListItemIcon><AccountCircleIcon fontSize="small" /></ListItemIcon>
              Hồ sơ
            </MenuItem>
          )}
          <MenuItem onClick={handleLogout}>
            <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
            Đăng xuất
          </MenuItem>
        </Menu>
      )}
    </AppBar>
  );
};

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
