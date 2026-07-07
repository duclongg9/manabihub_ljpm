import React from 'react';
import { Box, Toolbar, Container } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';

export const StudentLayout: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header showMenuIcon={false} />
      <Toolbar /> {/* Spacer */}
      <Box component="main" sx={{ flexGrow: 1, py: 4, bgcolor: 'background.default' }}>
        <Container maxWidth="lg">
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
};
