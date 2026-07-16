import React from 'react';
import { AppBar, Toolbar, Typography, Box, Button, IconButton, InputBase, Badge } from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import SearchIcon from '@mui/icons-material/Search';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../shared/constants/routes';

export const LandingHeader: React.FC = () => {
  const navigate = useNavigate();

  return (
    <AppBar position="sticky" sx={{ bgcolor: '#ffffff', color: '#0f172a', borderBottom: '1px solid #e2e8f0', boxShadow: 'none' }}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', px: { xs: 2, md: 4 }, py: 1 }}>
        {/* Left Section: Logo & Categories */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Box component={Link} to={ROUTES.PUBLIC.HOME} sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none', color: 'inherit' }}>
            <Box sx={{ width: 32, height: 32, bgcolor: '#3b82f6', borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MenuBookIcon sx={{ fontSize: 20, color: 'white' }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.5px', display: { xs: 'none', sm: 'block' } }}>
              ManabiHub
            </Typography>
          </Box>

          <Button
            component={Link}
            to={ROUTES.PUBLIC.COURSE_BROWSE}
            color="inherit"
            endIcon={<KeyboardArrowDownIcon />}
            sx={{ textTransform: 'none', fontWeight: 600, display: { xs: 'none', md: 'flex' }, textDecoration: 'none' }}
          >
            Danh mục
          </Button>
        </Box>

        {/* Center Section: Search Bar */}
        <Box sx={{ flexGrow: 1, maxWidth: 400, mx: 2, display: { xs: 'none', md: 'block' } }}>
          <Box sx={{
            display: 'flex', alignItems: 'center', bgcolor: '#f1f5f9', borderRadius: 6, px: 2, py: 0.5,
            border: '1px solid transparent', '&:focus-within': { borderColor: '#3b82f6', bgcolor: '#ffffff' }
          }}>
            <InputBase
              placeholder="Tìm kiếm khóa học, giảng viên..."
              sx={{ ml: 1, flex: 1, fontSize: '0.9rem' }}
            />
            <IconButton type="button" sx={{ p: '10px' }} aria-label="search">
              <SearchIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* Right Section: Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
          <Typography
            component={Link}
            to={ROUTES.TEACHER.KYC}
            sx={{ textDecoration: 'none', color: '#475569', fontWeight: 600, fontSize: '0.9rem', display: { xs: 'none', lg: 'block' }, '&:hover': { color: '#0f172a' } }}
          >
            Trở thành giảng viên
          </Typography>

          <IconButton color="inherit" sx={{ display: { xs: 'none', sm: 'flex' } }}>
            <Badge badgeContent={0} color="error">
              <ShoppingCartOutlinedIcon />
            </Badge>
          </IconButton>

          <Button
            variant="contained"
            onClick={() => navigate(ROUTES.PUBLIC.LOGIN)}
            sx={{ textTransform: 'none', fontWeight: 600, bgcolor: '#0f172a', color: 'white', borderRadius: 2, px: 3, '&:hover': { bgcolor: '#334155' } }}
          >
            Đăng nhập / Đăng ký
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};
