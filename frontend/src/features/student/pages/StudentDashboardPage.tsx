import React from 'react';
import { Box, Typography, Grid, Paper, CircularProgress, Alert, Button, Card, Chip, Stack } from '@mui/material';
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
      title: 'Chuỗi học tập',
      value: '3 ngày',
      subtext: 'Tiếp tục phát huy nhé! 🔥',
      icon: <LocalFireDepartmentIcon sx={{ fontSize: 32, color: '#C41E3A' }} />,
    },
    {
      title: 'Thời gian đã học tuần này',
      value: '45 phút',
      subtext: 'Mục tiêu: 2 giờ',
      icon: <MenuBookIcon sx={{ fontSize: 32, color: '#d97706' }} />,
    },
    {
      title: 'Từ vựng N3 đã thuộc',
      value: '25 từ',
      subtext: 'Bắt đầu ôn tập ngay ➔',
      icon: <EmojiEventsIcon sx={{ fontSize: 32, color: '#16a34a' }} />,
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: '1280px', width: '100%', mx: 'auto', bgcolor: '#FAF9F6', borderRadius: 4, position: 'relative', overflow: 'hidden' }}>
      {/* Background Watermark */}
      <Typography variant="h1" sx={{ position: 'absolute', top: -20, right: -20, fontSize: '15rem', fontWeight: 900, color: 'rgba(0,0,0,0.025)', userSelect: 'none', pointerEvents: 'none', zIndex: 0, writingMode: 'vertical-rl' }}>
        目標
      </Typography>

      <Box sx={{ position: 'relative', zIndex: 1 }}>
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
                  borderColor: 'slate.100',
                  borderRadius: 4,
                  bgcolor: 'white',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  },
                }}
              >
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.5 }}>
                    {card.title}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: 'grey.900', mb: 0.5 }}>
                    {card.value}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: index === 2 ? 700 : 600,
                      color: index === 2 ? '#C41E3A' : (index === 0 ? '#C41E3A' : 'text.secondary'),
                      cursor: index === 2 ? 'pointer' : 'default',
                      display: 'inline-block',
                      '&:hover': index === 2 ? { textDecoration: 'underline' } : {}
                    }}
                  >
                    {card.subtext}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: '50%',
                    bgcolor: 'grey.50',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {card.icon}
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Main Content Area */}
        <Grid container spacing={4} sx={{ alignItems: 'stretch' }}>
          
          {/* Continue Learning Section */}
          <Grid size={{ xs: 12, md: 8 }} sx={{ display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 40 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'grey.900' }}>
                Khóa học đang học
              </Typography>
              <Button endIcon={<ArrowForwardIcon />} color="inherit" onClick={() => navigate('/student/courses')} sx={{ textTransform: 'none', fontWeight: 600 }}>
                Xem tất cả
              </Button>
            </Box>

            <Card sx={{ borderRadius: 4, p: 4, border: '1px solid', borderColor: 'grey.200', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {stats?.activeCourses && stats.activeCourses > 0 ? (
                <Box>
                  <Typography variant="body1" color="text.secondary">Bạn có khóa học đang diễn ra. Chức năng học tiếp sẽ sớm được cập nhật!</Typography>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Box sx={{ fontSize: '7rem', mb: 1, filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.1))', transform: 'rotate(-5deg)' }}>🐕</Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1, color: 'grey.900', fontSize: '1.25rem' }}>Hành trình JLPT {profile?.jlptGoal || 'N3'} đang chờ bạn!</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 4, maxWidth: 320, mx: 'auto', lineHeight: 1.6 }}>Đăng ký khóa học đầu tiên để kích hoạt tiến trình học tập và kết bạn cùng Shiba-kun nhé.</Typography>
                  <Button variant="contained" onClick={() => navigate('/student/browse')} sx={{ borderRadius: 8, px: 4, py: 1.5, textTransform: 'none', fontWeight: 700, fontSize: '1rem', bgcolor: '#C41E3A', '&:hover': { bgcolor: '#a01830' }, boxShadow: '0 4px 14px 0 rgba(196,30,58,0.39)' }}>
                    Khám phá khóa học ngay
                  </Button>
                </Box>
              )}
            </Card>
          </Grid>

          {/* Recommended & Goals Section */}
          <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ mb: 2, minHeight: 40, display: 'flex', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'grey.900' }}>
                Lộ trình gợi ý
              </Typography>
            </Box>
            <Card sx={{ borderRadius: 4, p: 3, border: '1px solid', borderColor: 'grey.200', boxShadow: 'none', bgcolor: 'white', flexGrow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ flexGrow: 1, fontWeight: 700 }}>MỤC TIÊU CỦA BẠN</Typography>
                <Chip label={profile?.jlptGoal || 'JLPT N3'} sx={{ fontWeight: 800, borderRadius: 1.5, bgcolor: '#C41E3A', color: 'white' }} />
              </Box>
              
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'grey.700', mb: 2 }}>
                Luyện kỹ năng theo lộ trình chuẩn:
              </Typography>

              <Stack spacing={1.5}>
                {['Kanji & Từ vựng', 'Ngữ pháp', 'Đọc hiểu & Nghe'].map((skill, i) => (
                  <Box
                    key={i}
                    onClick={() => navigate('/student/browse')}
                    sx={{
                      p: 2, borderRadius: 3, border: '1px solid', borderColor: 'grey.200',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      cursor: 'pointer', transition: 'all 0.2s',
                      '&:hover': { 
                        borderColor: '#fecdd3', 
                        bgcolor: '#fff1f2', 
                        transform: 'translateX(4px)',
                        '& .title-text': { color: '#C41E3A' },
                        '& .arrow-icon': { color: '#C41E3A' }
                      }
                    }}
                  >
                    <Typography className="title-text" variant="body2" sx={{ fontWeight: 700, color: 'grey.800', transition: 'color 0.2s' }}>
                      Luyện {skill} {profile?.jlptGoal || 'N3'}
                    </Typography>
                    <ArrowForwardIcon className="arrow-icon" sx={{ fontSize: 16, color: 'grey.400', transition: 'color 0.2s' }} />
                  </Box>
                ))}
              </Stack>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};
