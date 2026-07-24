import React from 'react';
import { Box, Typography, Grid, Paper, CircularProgress, Alert, Button, Card, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useStudentStats } from '../hooks/useStudentStats';
import { getMyStudentProfile } from '../../profile/profileApi';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

export const StudentDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: stats, isLoading: isStatsLoading, isError: isStatsError, error: statsError } = useStudentStats();
  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['student-profile'],
    queryFn: getMyStudentProfile
  });

  if (isStatsLoading || isProfileLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4, minHeight: '50vh', alignItems: 'center' }}>
        <CircularProgress color="error" />
      </Box>
    );
  }

  if (isStatsError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Không thể tải dữ liệu tổng quan: {(statsError as Error).message}
        </Alert>
      </Box>
    );
  }

  const statCards = [
    {
      title: 'Tổng khóa học',
      value: stats?.totalEnrolledCourses || 0,
      icon: <MenuBookIcon sx={{ fontSize: 32, color: '#C41E3A' }} />,
      bgColor: '#fff1f2',
      borderColor: '#fecdd3',
    },
    {
      title: 'Đang học',
      value: stats?.activeCourses || 0,
      icon: <LocalFireDepartmentIcon sx={{ fontSize: 32, color: '#d97706' }} />,
      bgColor: '#fef3c7',
      borderColor: '#fde68a',
    },
    {
      title: 'Đã hoàn thành',
      value: stats?.completedCourses || 0,
      icon: <EmojiEventsIcon sx={{ fontSize: 32, color: '#eab308' }} />,
      bgColor: '#fef9c3',
      borderColor: '#fef08a',
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      
      {/* Personalized Greeting */}
      <Box sx={{ mb: 5 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: 'grey.900', mb: 1 }}>
          Chào buổi sáng, {profile?.displayName || 'bạn'}-san! 👋
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '1.1rem' }}>
          Hôm nay bạn muốn chinh phục kiến thức nào?
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
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
                borderColor: card.borderColor,
                borderRadius: 4,
                bgcolor: card.bgColor,
                background: `linear-gradient(135deg, ${card.bgColor} 0%, rgba(255,255,255,0.7) 100%)`,
                backdropFilter: 'blur(10px)',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                },
              }}
            >
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.5 }}>
                  {card.title}
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 900, color: 'grey.900' }}>
                  {card.value}
                </Typography>
              </Box>
              <Box
                sx={{
                  p: 2,
                  borderRadius: '50%',
                  bgcolor: 'rgba(255,255,255,0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'inset 0 2px 4px 0 rgba(0,0,0,0.06)'
                }}
              >
                {card.icon}
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Main Content Area */}
      <Grid container spacing={4}>
        
        {/* Continue Learning Section */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: 'grey.900' }}>
              Khóa học đang học
            </Typography>
            <Button endIcon={<ArrowForwardIcon />} color="inherit" onClick={() => navigate('/student/courses')} sx={{ textTransform: 'none', fontWeight: 600 }}>
              Xem tất cả
            </Button>
          </Box>

          <Card sx={{ borderRadius: 4, p: 3, border: '1px solid', borderColor: 'grey.200', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            {stats?.activeCourses && stats.activeCourses > 0 ? (
              <Box>
                 <Typography variant="body1" color="text.secondary">Bạn có khóa học đang diễn ra. Chức năng học tiếp sẽ sớm được cập nhật!</Typography>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Box sx={{ width: 64, height: 64, borderRadius: '50%', bgcolor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                  <MenuBookIcon sx={{ fontSize: 32, color: 'grey.400' }} />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Chưa có khóa học nào</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Bạn chưa bắt đầu khóa học nào. Hãy khám phá và đăng ký ngay!</Typography>
                <Button variant="contained" onClick={() => navigate('/courses')} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
                  Khám phá khóa học
                </Button>
              </Box>
            )}
          </Card>
        </Grid>

        {/* Recommended & Goals Section */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: 'grey.900', mb: 3 }}>
            Lộ trình gợi ý
          </Typography>
          <Card sx={{ borderRadius: 4, p: 3, border: '1px solid', borderColor: 'grey.200', boxShadow: 'none', bgcolor: 'grey.50' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ flexGrow: 1, fontWeight: 600 }}>MỤC TIÊU CỦA BẠN</Typography>
              <Chip label={profile?.jlptGoal || 'Chưa thiết lập'} color="error" size="small" sx={{ fontWeight: 700, borderRadius: 1 }} />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
              Dựa trên mục tiêu JLPT của bạn, chúng tôi sẽ sớm ra mắt hệ thống gợi ý lộ trình học tập cá nhân hóa.
            </Typography>
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'white', border: '1px dashed', borderColor: 'grey.300', textAlign: 'center' }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'grey.500' }}>Sắp ra mắt</Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>

    </Box>
  );
};
