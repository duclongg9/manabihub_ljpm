import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Paper, CircularProgress, Alert, Button, Stack, Chip, Card, CardContent, Divider } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import CreateIcon from '@mui/icons-material/Create';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import AddIcon from '@mui/icons-material/Add';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import type { TeacherDashboardResponse } from '../services/teacherDashboardService';
import { fetchTeacherDashboardStats } from '../services/teacherDashboardService';
import { ROUTES } from '../../../shared/constants/routes';

export const TeacherDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<TeacherDashboardResponse | null>(null);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTeacherDashboardStats();
      setStats(data);
    } catch {
      setError('Không thể tải dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);


  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={loadData}>
              Thử lại
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  const totalCourses = stats?.totalCourses || 0;
  const draftOrCorrection = stats?.draftOrCorrection || 0;
  const pendingApproval = stats?.pendingApproval || 0;
  const published = stats?.published || 0;
  const recentCourses = stats?.recentCourses || [];

  const renderStatusChip = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return <Chip label="Đã xuất bản" color="success" size="small" />;
      case 'PENDING':
        return <Chip label="Chờ duyệt" color="warning" size="small" />;
      case 'DRAFT':
      case 'FORCED_DRAFT':
        return <Chip label="Bản nháp" color="default" size="small" />;
      case 'APPROVED':
        return <Chip label="Đã duyệt" color="info" size="small" />;
      case 'REJECTED':
        return <Chip label="Từ chối" color="error" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2, mb: 4 }}
      >
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Tổng quan Giảng viên</Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<AccountBalanceWalletOutlinedIcon />}
            onClick={() => navigate(ROUTES.TEACHER.WALLET)}
          >
            Ví của tôi
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate(ROUTES.TEACHER.COURSE_CREATE)}
          >
            Tạo khóa học
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2, height: '100%' }}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'primary.light', color: 'primary.dark' }}>
              <AutoStoriesIcon />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{totalCourses}</Typography>
              <Typography variant="body2" color="text.secondary">Tổng khóa học</Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2, height: '100%' }}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'grey.200', color: 'grey.700' }}>
              <CreateIcon />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{draftOrCorrection}</Typography>
              <Typography variant="body2" color="text.secondary">Bản nháp</Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2, height: '100%' }}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'warning.light', color: 'warning.dark' }}>
              <HourglassEmptyIcon />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{pendingApproval}</Typography>
              <Typography variant="body2" color="text.secondary">Đang chờ duyệt</Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2, height: '100%' }}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'success.light', color: 'success.dark' }}>
              <CheckCircleOutlinedIcon />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{published}</Typography>
              <Typography variant="body2" color="text.secondary">Đã xuất bản</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>Khóa học gần đây</Typography>
      {recentCourses.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <AutoStoriesIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Bạn chưa có khóa học nào
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Hãy bắt đầu chia sẻ kiến thức của bạn bằng cách tạo khóa học đầu tiên.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate(ROUTES.TEACHER.COURSE_CREATE)}
          >
            Tạo khóa học ngay
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {recentCourses.map((course) => (
            <Grid size={{ xs: 12, md: 6 }} key={course.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', pr: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {course.title || 'Khóa học chưa có tiêu đề'}
                    </Typography>
                    {renderStatusChip(course.status)}
                  </Stack>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Mức độ: {course.jlptLevel || 'Chưa chọn'}
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    Tạo lúc: {course.createdAt ? new Date(course.createdAt).toLocaleDateString('vi-VN') : 'Không rõ'}
                  </Typography>
                </CardContent>
                <Divider />
                <Box sx={{ p: 2, display: 'flex', gap: 2, minHeight: 68 }}>
                  {course.status === 'DRAFT' && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => navigate(ROUTES.TEACHER.COURSE_BUILDER(course.id))}
                      fullWidth
                    >
                      Tiếp tục biên soạn
                    </Button>
                  )}
                  {course.status === 'PUBLISHED' && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => navigate(ROUTES.PUBLIC.COURSE_DETAIL.replace(':id', course.slug || course.id))}
                      fullWidth
                    >
                      Xem chi tiết
                    </Button>
                  )}
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {totalCourses > 4 && (
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Button variant="text" onClick={() => navigate(ROUTES.TEACHER.COURSES)}>
            Xem tất cả khóa học
          </Button>
        </Box>
      )}
    </Box>
  );
};
