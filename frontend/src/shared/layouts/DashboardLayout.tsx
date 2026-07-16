import { useEffect, useState } from 'react';
import { Box, Toolbar, useMediaQuery, useTheme } from '@mui/material';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import {
  getAuthSession,
  getDefaultRoute,
  getLoginRoute,
  hasAnyRole,
  type AuthSessionKind,
} from '../auth/authSession';
import { Header } from './Header';
import {
  COLLAPSED_DRAWER_WIDTH,
  DRAWER_WIDTH,
  Sidebar,
  type MenuItem,
} from './Sidebar';

interface DashboardLayoutProps {
  allowedRoles: readonly string[];
  menuItems: MenuItem[];
  sessionKind: AuthSessionKind;
}

const SIDEBAR_PREFERENCE_KEY = 'dashboard_sidebar_collapsed';

export function DashboardLayout({ allowedRoles, menuItems, sessionKind }: DashboardLayoutProps) {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(() =>
    typeof window !== 'undefined'
      && window.localStorage.getItem(SIDEBAR_PREFERENCE_KEY) === 'true',
  );
  const session = getAuthSession(sessionKind);

  useEffect(() => {
    setMobileOpen(false);
  }, [isMobile, location.pathname]);

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_PREFERENCE_KEY, String(desktopCollapsed));
  }, [desktopCollapsed]);

  if (!session) {
    return (
      <Navigate
        to={getLoginRoute(sessionKind)}
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  if (!hasAnyRole(session, allowedRoles)) {
    return <Navigate to={getDefaultRoute(session)} replace state={{ accessDenied: true }} />;
  }

  const collapsed = !isMobile && desktopCollapsed;
  const drawerWidth = collapsed ? COLLAPSED_DRAWER_WIDTH : DRAWER_WIDTH;

  const handleMenuClick = () => {
    if (isMobile) {
      setMobileOpen((open) => !open);
      return;
    }

    setDesktopCollapsed((value) => !value);
  };

  return (
    <Box sx={{ bgcolor: 'background.default', display: 'flex', minHeight: '100vh' }}>
      <Header
        menuExpanded={isMobile ? mobileOpen : !desktopCollapsed}
        onMenuClick={handleMenuClick}
        session={session}
        showMenuIcon
      />

      <Sidebar
        collapsed={collapsed}
        menuItems={menuItems}
        onClose={() => setMobileOpen(false)}
        open={isMobile ? mobileOpen : true}
        userRoles={session.roles}
        variant={isMobile ? 'temporary' : 'permanent'}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          overflowX: 'hidden',
          p: { xs: 2, sm: 3 },
          transition: theme.transitions.create('width', {
            duration: theme.transitions.duration.shorter,
            easing: theme.transitions.easing.sharp,
          }),
          width: isMobile ? '100%' : `calc(100% - ${drawerWidth}px)`,
        }}
      >
        <Toolbar />
        <Box sx={{ maxWidth: 1440, mx: 'auto', width: '100%' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
