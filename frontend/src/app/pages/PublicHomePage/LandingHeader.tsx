import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, Box, Button, IconButton, InputBase, Avatar, Menu, MenuItem } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../shared/constants/routes';
import {
  clearAuthSession,
  getAuthSession,
  getDefaultRoute,
  subscribeToAuthSessionChanges,
} from '../../../shared/auth/authSession';
import { ROLES } from '../../../shared/constants/roles';

export const LandingHeader: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [scrolled, setScrolled] = useState(false);
  const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(null);
  const [session, setSession] = useState(() => getAuthSession('public'));
  const avatarLabel = session?.email?.trim().charAt(0).toUpperCase() || 'U';
  const username = session?.email?.split('@')[0] || 'User';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 60);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(
    () => subscribeToAuthSessionChanges(
      () => setSession(getAuthSession('public')),
    ),
    [],
  );

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`${ROUTES.PUBLIC.COURSE_BROWSE}?keyword=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate(ROUTES.PUBLIC.COURSE_BROWSE);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleLogout = () => {
    setProfileAnchorEl(null);
    setSession(null);
    clearAuthSession('public');
    window.location.replace(ROUTES.PUBLIC.HOME);
  };

  return (
    <AppBar
      position="sticky"
      sx={{
        bgcolor: scrolled ? 'rgba(255, 255, 255, 0.97)' : 'rgba(255, 255, 255, 0.92)',
        color: '#1A1A2E',
        borderBottom: scrolled ? '1px solid #e8e0d8' : '1px solid transparent',
        boxShadow: scrolled ? '0 2px 20px rgba(0,0,0,0.06)' : 'none',
        backdropFilter: 'blur(12px)',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', minWidth: 0, px: { xs: 1.5, md: 4 }, py: 1 }}>
        {/* Left section: brand */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Box component={Link} to={ROUTES.PUBLIC.HOME} sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none', color: 'inherit' }}>
            <Box
              sx={{
                height: { xs: 48, sm: 54 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.3s ease',
                '&:hover': { transform: 'scale(1.08)' }
              }}
            >
              <Box
                component="img"
                src="/manabihub-header-logo.png"
                alt="ManabiHub"
                sx={{ display: 'block', height: { xs: 48, sm: 54 }, width: 'auto' }}
              />
            </Box>
            {/* <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.5px', display: { xs: 'none', sm: 'block' }, color: '#1A1A2E' }}>
              ManabiHub
            </Typography> */}
          </Box>
        </Box>

        {/* Center Section: Search Bar */}
        <Box sx={{ flexGrow: 1, maxWidth: 420, mx: 2, display: { xs: 'none', md: 'block' } }}>
          <Box sx={{
            display: 'flex', alignItems: 'center',
            bgcolor: '#FAF8F5',
            borderRadius: '12px',
            px: 2, py: 0.5,
            border: '1.5px solid #e8e0d8',
            transition: 'all 0.3s ease',
            '&:hover': {
              borderColor: '#fca5a5',
            },
            '&:focus-within': {
              borderColor: '#C41E3A',
              bgcolor: '#ffffff',
              boxShadow: '0 0 0 3px rgba(196, 30, 58, 0.08)'
            }
          }}>
            <InputBase
              placeholder="Tìm kiếm khóa học, giảng viên..."
              sx={{ ml: 1, flex: 1, fontSize: '0.9rem', color: '#1A1A2E' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <IconButton
              type="button"
              sx={{
                p: '8px',
                color: '#94a3b8',
                '.MuiBox-root:focus-within &': { color: '#C41E3A' },
                '&:hover': { color: '#C41E3A' }
              }}
              aria-label="search"
              onClick={handleSearch}
            >
              <SearchIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* Right Section: Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
          {!session && (
            <Typography
              component={Link}
              to={ROUTES.TEACHER.KYC}
              sx={{
                textDecoration: 'none',
                color: '#475569',
                fontWeight: 600,
                fontSize: '0.9rem',
                display: { xs: 'none', lg: 'block' },
                transition: 'color 0.3s ease',
                '&:hover': { color: '#C41E3A' }
              }}
            >
              Trở thành giảng viên
            </Typography>
          )}

          {session ? (
            <>
              <IconButton 
                onClick={(e) => setProfileAnchorEl(e.currentTarget)}
                sx={{ ml: 1, p: 0.5, border: '2px solid transparent', transition: 'border 0.2s', '&:hover': { borderColor: '#e2e8f0' } }}
              >
                <Avatar sx={{ width: 36, height: 36, bgcolor: '#C41E3A', fontSize: '1rem', fontWeight: 700 }}>{avatarLabel}</Avatar>
              </IconButton>
              <Menu
                anchorEl={profileAnchorEl}
                open={Boolean(profileAnchorEl)}
                onClose={() => setProfileAnchorEl(null)}
                disableScrollLock
                sx={{ 
                  zIndex: 9999, 
                  '& .MuiPaper-root': { 
                    mt: 1.5, 
                    borderRadius: '12px', 
                    minWidth: 220, 
                    boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)', 
                    border: '1px solid #f1f5f9' 
                  } 
                }}
              >
                <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #f1f5f9', mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>{username}</Typography>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>{session.email}</Typography>
                </Box>
                <MenuItem onClick={() => { setProfileAnchorEl(null); navigate(getDefaultRoute(session)); }} sx={{ py: 1.5, fontWeight: 600, color: '#1A1A2E' }}>
                  Bảng điều khiển
                </MenuItem>
                <MenuItem onClick={() => {
                  setProfileAnchorEl(null);
                  navigate(
                    session.roles.includes(ROLES.TEACHER)
                      ? ROUTES.TEACHER.PROFILE
                      : ROUTES.STUDENT.PROFILE,
                  );
                }} sx={{ py: 1.5, color: '#475569' }}>
                  Hồ sơ cá nhân
                </MenuItem>
                <MenuItem onClick={handleLogout} sx={{ py: 1.5, color: '#C41E3A' }}>
                  Đăng xuất
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Button
              variant="contained"
              onClick={() => navigate(ROUTES.PUBLIC.LOGIN)}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                bgcolor: '#1B2A4A',
                color: 'white',
                borderRadius: 2,
                px: { xs: 1.5, sm: 3 },
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                transition: 'all 0.3s ease',
                '&:hover': { bgcolor: '#2A3F6A', transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(27, 42, 74, 0.3)' }
              }}
            >
              Đăng nhập / Đăng ký
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};
