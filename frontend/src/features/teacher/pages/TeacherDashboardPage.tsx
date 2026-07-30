import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Paper, Button, Stack, Chip, Card, CardContent, Divider } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import CreateIcon from '@mui/icons-material/Create';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import AddIcon from '@mui/icons-material/Add';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import type { TeacherDashboardResponse } from '../services/teacherDashboardService';
import { fetchTeacherDashboardStats } from '../services/teacherDashboardService';
import { EmptyState } from '../../../shared/components/EmptyState/EmptyState';
import { LoadingState } from '../../../shared/components/LoadingState/LoadingState';
import { ErrorState } from '../../../shared/components/ErrorState/ErrorState';
import { PageHeader } from '../../../shared/components/PageHeader/PageHeader';
import { ROUTES } from '../../../shared/constants/routes';
import { getAuthSession } from '../../../shared/auth/authSession';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import { courseStatusLabel, courseStatusColor } from '../../course-builder/utils/courseStatus';

export const TeacherDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<TeacherDashboardResponse | null>(null);

  const session = getAuthSession('public');
  const teacherId = session?.subject;

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
    return <LoadingState message="Đang tải tổng quan..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  const totalCourses = stats?.totalCourses || 0;
  const draftOrCorrection = stats?.draftOrCorrection || 0;
  const pendingApproval = stats?.pendingApproval || 0;
  const published = stats?.published || 0;
  const recentCourses = stats?.recentCourses || [];

  const renderStatusChip = (status: string) => {
    return <Chip label={courseStatusLabel(status)} color={courseStatusColor(status)} size="small" />;
  };

  return (
    <Box sx={{ pb: 6 }}>
      <PageHeader
        title="Tổng quan Giảng viên"
        subtitle="Quản lý khóa học, doanh thu và các hoạt động giảng dạy"
        breadcrumbs={[
          { label: 'Giảng viên' },
          { label: 'Tổng quan' },
        ]}
        action={(
          <Stack direction="row" spacing={1}>
            {teacherId && (
              <Button
                variant="outlined"
                startIcon={<AccountCircleOutlinedIcon />}
                onClick={() => navigate(ROUTES.PUBLIC.TEACHER_PROFILE(teacherId))}
                sx={{ textTransform: 'none', fontWeight: 700 }}
              >
                Hồ sơ công khai
              </Button>
            )}
            <Button
              variant="outlined"
              startIcon={<AccountBalanceWalletOutlinedIcon />}
              onClick={() => navigate(ROUTES.TEACHER.WALLET)}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Ví của tôi
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate(ROUTES.TEACHER.COURSE_CREATE)}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Tạo khóa học
            </Button>
          </Stack>
        )}
      />

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
        <Paper sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <EmptyState
            title="Bạn chưa có khóa học nào"
            description="Hãy bắt đầu chia sẻ kiến thức của bạn bằng cách tạo khóa học đầu tiên."
            actionLabel="Tạo khóa học ngay"
            onAction={() => navigate(ROUTES.TEACHER.COURSE_CREATE)}
            icon={<AutoStoriesIcon sx={{ fontSize: 64, color: 'text.disabled' }} />}
          />
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
