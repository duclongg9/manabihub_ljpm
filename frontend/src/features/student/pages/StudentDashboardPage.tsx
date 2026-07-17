import React from 'react';
import { Box, Typography, Grid, Paper, CircularProgress, Alert, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useStudentStats } from '../hooks/useStudentStats';
import SchoolIcon from '@mui/icons-material/School';
import PlayCircleOutlinedIcon from '@mui/icons-material/PlayCircleOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';

export const StudentDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: stats, isLoading, isError, error } = useStudentStats();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Error loading dashboard stats: {(error as Error).message}
        </Alert>
      </Box>
    );
  }

  const statCards = [
    {
      title: 'Total Courses',
      value: stats?.totalEnrolledCourses || 0,
      icon: <SchoolIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      color: 'primary.light',
    },
    {
      title: 'Active Courses',
      value: stats?.activeCourses || 0,
      icon: <PlayCircleOutlinedIcon sx={{ fontSize: 40, color: 'info.main' }} />,
      color: 'info.light',
    },
    {
      title: 'Completed Courses',
      value: stats?.completedCourses || 0,
      icon: <CheckCircleOutlinedIcon sx={{ fontSize: 40, color: 'success.main' }} />,
      color: 'success.light',
    },
  ];

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Dashboard
        </Typography>
        <Button variant="contained" onClick={() => navigate('/student/courses')}>
          View My Learning
        </Button>
      </Box>

      <Grid container spacing={3}>
        {statCards.map((card, index) => (
          <Grid size={{ xs: 12, sm: 4 }} key={index}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                bgcolor: 'background.paper',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 2,
                },
              }}
            >
              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  {card.title}
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                  {card.value}
                </Typography>
              </Box>
              <Box
                sx={{
                  p: 2,
                  borderRadius: '50%',
                  bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : card.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.8,
                }}
              >
                {card.icon}
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
