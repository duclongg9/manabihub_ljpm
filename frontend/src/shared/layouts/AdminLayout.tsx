import React, { useState } from 'react';
import { Box, Toolbar } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { ADMIN_MENU } from '../navigation/adminMenu';

export const AdminLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header showMenuIcon onMenuClick={handleDrawerToggle} />
      <Sidebar 
        menuItems={ADMIN_MENU} 
        open={mobileOpen} 
        onClose={handleDrawerToggle}
        variant="permanent"
      />
      
      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - 260px)` } }}>
        <Toolbar /> {/* Spacer */}
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};
