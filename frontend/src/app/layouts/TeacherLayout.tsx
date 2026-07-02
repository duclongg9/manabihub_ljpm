import { AppBar, Box, Button, Container, Toolbar, Typography } from '@mui/material';
import { Link as RouterLink, Outlet } from 'react-router-dom';

export function TeacherLayout() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar elevation={0} position="static">
        <Toolbar>
          <Typography component="h1" sx={{ flexGrow: 1, fontSize: 20, fontWeight: 800 }}>
            ManabiHub Teacher
          </Typography>
          <Button color="inherit" component={RouterLink} to="/teacher/kyc">
            KYC
          </Button>
        </Toolbar>
      </AppBar>
      <Container component="main" maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
        <Outlet />
      </Container>
    </Box>
  );
}
