import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getMyStudentProfile } from '../../profile/profileApi';
import { ROUTES } from '../../../shared/constants/routes';
import { StudentCourseCard } from '../components/StudentCourseCard';
import { useStudentCourses } from '../hooks/useStudentCourses';
import { useStudentStats } from '../hooks/useStudentStats';

export function StudentDashboardPage() {
  const navigate = useNavigate();
  const statsQuery = useStudentStats();
  const coursesQuery = useStudentCourses(0, 3);
  const profileQuery = useQuery({
    queryKey: ['student-profile'],
    queryFn: getMyStudentProfile,
  });

  const isLoading = statsQuery.isLoading || coursesQuery.isLoading || profileQuery.isLoading;
  const hasError = statsQuery.isError || coursesQuery.isError || profileQuery.isError;

  if (isLoading) {
    return (
      <Box sx={{ minHeight: 360, display: 'grid', placeItems: 'center' }}>
        <CircularProgress aria-label="Đang tải tổng quan học tập" />
      </Box>
    );
  }

  if (hasError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => {
                statsQuery.refetch();
                coursesQuery.refetch();
                profileQuery.refetch();
              }}
            >
              Thử lại
            </Button>
          }
        >
          Không thể tải tổng quan học tập. Vui lòng thử lại.
        </Alert>
      </Box>
    );
  }

  const stats = statsQuery.data;
  const courses = coursesQuery.data?.content ?? [];
  const statCards = [
    {
      label: 'Khóa học đã ghi danh',
      value: stats?.totalEnrolledCourses ?? 0,
      icon: MenuBookOutlinedIcon,
      color: 'primary.main',
    },
    {
      label: 'Đang học',
      value: stats?.activeCourses ?? 0,
      icon: PlayCircleOutlineIcon,
      color: 'warning.main',
    },
    {
      label: 'Đã hoàn thành',
      value: stats?.completedCourses ?? 0,
      icon: TaskAltOutlinedIcon,
      color: 'success.main',
    },
  ];

  return (
    <Box component="main" sx={{ p: { xs: 2, md: 4 }, maxWidth: 1280, mx: 'auto' }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2, mb: 4 }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Chào {profileQuery.data?.displayName || 'bạn'}
          </Typography>
          <Typography color="text.secondary">
            Tiếp tục lộ trình JLPT {profileQuery.data?.jlptGoal || 'của bạn'} từ nơi bạn đã dừng lại.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          endIcon={<ArrowForwardIcon />}
          onClick={() => navigate(ROUTES.STUDENT.MY_COURSES)}
        >
          Xem tất cả khóa học
        </Button>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 5 }}>
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <Grid size={{ xs: 12, sm: 4 }} key={label}>
            <Paper
              variant="outlined"
              sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2, height: '100%' }}
            >
              <Icon sx={{ color, fontSize: 32 }} />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 800 }}>{value}</Typography>
                <Typography variant="body2" color="text.secondary">{label}</Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
        Khóa học gần đây
      </Typography>
      {courses.length === 0 ? (
        <Box sx={{ py: 7, textAlign: 'center', borderTop: '1px solid', borderColor: 'divider' }}>
          <MenuBookOutlinedIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            Bạn chưa ghi danh khóa học nào
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Khám phá danh mục khóa học đã xuất bản để bắt đầu lộ trình học.
          </Typography>
          <Button variant="contained" onClick={() => navigate(ROUTES.STUDENT.BROWSE_COURSES)}>
            Khám phá khóa học
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {courses.map((course) => (
            <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={course.enrollmentId}>
              <StudentCourseCard course={course} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
