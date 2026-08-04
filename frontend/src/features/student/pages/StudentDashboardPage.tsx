import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AutoStoriesOutlinedIcon from '@mui/icons-material/AutoStoriesOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../shared/constants/routes';
import { getMyStudentProfile } from '../../profile/profileApi';
import { StudentCourseCard } from '../components/StudentCourseCard';
import { useStudentCourses } from '../hooks/useStudentCourses';
import { useStudentStats } from '../hooks/useStudentStats';

const BRAND_COLORS = {
  red: '#C41E3A',
  gold: '#B7791F',
  green: '#2F855A',
  navy: '#1B2A4A',
};

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
      <Box sx={{ minHeight: 420, display: 'grid', placeItems: 'center', bgcolor: '#FAF9F6' }}>
        <Stack spacing={2} sx={{ alignItems: 'center' }}>
          <CircularProgress aria-label="Đang tải tổng quan học tập" sx={{ color: BRAND_COLORS.red }} />
          <Typography color="text.secondary">Đang chuẩn bị không gian học tập của bạn...</Typography>
        </Stack>
      </Box>
    );
  }

  if (hasError) {
    return (
      <Box sx={{ minHeight: '100%', bgcolor: '#FAF9F6', p: { xs: 2, md: 4 } }}>
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
  const profile = profileQuery.data;
  const jlptGoal = profile?.jlptGoal || 'chưa thiết lập';
  const statCards = [
    {
      label: 'Khóa học đã ghi danh',
      value: stats?.totalEnrolledCourses ?? 0,
      helper: 'Tổng số khóa học của bạn',
      icon: MenuBookOutlinedIcon,
      color: BRAND_COLORS.navy,
      tint: '#EEF2F7',
    },
    {
      label: 'Đang học',
      value: stats?.activeCourses ?? 0,
      helper: 'Có thể tiếp tục ngay',
      icon: PlayCircleOutlineIcon,
      color: BRAND_COLORS.gold,
      tint: '#FFF8E7',
    },
    {
      label: 'Đã hoàn thành',
      value: stats?.completedCourses ?? 0,
      helper: 'Khóa học đã hoàn tất',
      icon: TaskAltOutlinedIcon,
      color: BRAND_COLORS.green,
      tint: '#ECF8F1',
    },
  ];

  return (
    <Box
      component="main"
      sx={{
        minHeight: '100%',
        bgcolor: '#FAF9F6',
        px: { xs: 2, sm: 3, lg: 4 },
        py: { xs: 3, md: 5 },
        overflow: 'hidden',
      }}
    >
      <Box sx={{ maxWidth: 1280, mx: 'auto', position: 'relative' }}>
        <Typography
          aria-hidden="true"
          sx={{
            position: 'absolute',
            top: -62,
            right: -24,
            color: 'rgba(27, 42, 74, 0.035)',
            fontSize: { xs: '8rem', md: '13rem' },
            fontWeight: 900,
            lineHeight: 1,
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          目標
        </Typography>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          sx={{
            position: 'relative',
            justifyContent: 'space-between',
            alignItems: { sm: 'flex-end' },
            gap: 2,
            mb: 4,
          }}
        >
          <Box>
            <Typography
              variant="overline"
              sx={{ color: BRAND_COLORS.red, fontWeight: 800, letterSpacing: '0.08em' }}
            >
              おかえりなさい
            </Typography>
            <Typography
              variant="h4"
              sx={{ mt: 0.5, mb: 1, color: '#172033', fontWeight: 900 }}
            >
              Chào {profile?.displayName || 'bạn'}
            </Typography>
            <Typography sx={{ color: '#5B6472', fontSize: { xs: '0.95rem', md: '1.05rem' } }}>
              Tiếp tục lộ trình JLPT {jlptGoal} từ nơi bạn đã dừng lại.
            </Typography>
          </Box>
          <Button
            variant="outlined"
            endIcon={<ArrowForwardIcon />}
            onClick={() => navigate(ROUTES.STUDENT.MY_COURSES)}
            sx={{
              alignSelf: { xs: 'flex-start', sm: 'auto' },
              borderColor: '#CBD2DC',
              color: BRAND_COLORS.navy,
              fontWeight: 800,
              bgcolor: 'rgba(255,255,255,0.7)',
              '&:hover': { borderColor: BRAND_COLORS.red, color: BRAND_COLORS.red },
            }}
          >
            Xem tất cả khóa học
          </Button>
        </Stack>

        <Grid container spacing={2.5} sx={{ position: 'relative', mb: 5 }}>
          {statCards.map(({ label, value, helper, icon: Icon, color, tint }) => (
            <Grid size={{ xs: 12, sm: 4 }} key={label}>
              <Paper
                elevation={0}
                sx={{
                  minHeight: 132,
                  p: 2.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  border: '1px solid #E4E7EC',
                  borderRadius: '8px',
                  bgcolor: '#FFFFFF',
                  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.045)',
                  transition: 'transform 180ms ease, box-shadow 180ms ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 28px rgba(15, 23, 42, 0.08)',
                  },
                }}
              >
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    flexShrink: 0,
                    display: 'grid',
                    placeItems: 'center',
                    borderRadius: '8px',
                    color,
                    bgcolor: tint,
                  }}
                >
                  <Icon sx={{ fontSize: 30 }} />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h4" sx={{ color: '#172033', fontWeight: 900, lineHeight: 1 }}>
                    {value}
                  </Typography>
                  <Typography sx={{ mt: 0.75, color: '#303846', fontWeight: 800 }}>
                    {label}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#7A8391' }}>
                    {helper}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3.5} sx={{ alignItems: 'stretch' }}>
          <Grid size={{ xs: 12, lg: 8.5 }}>
            <Stack
              direction="row"
              sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
            >
              <Box>
                <Typography variant="h6" sx={{ color: '#172033', fontWeight: 900 }}>
                  Khóa học gần đây
                </Typography>
                <Typography variant="caption" sx={{ color: '#7A8391', letterSpacing: '0.06em' }}>
                  最近のコース
                </Typography>
              </Box>
              {courses.length > 0 && (
                <Button
                  size="small"
                  onClick={() => navigate(ROUTES.STUDENT.MY_COURSES)}
                  endIcon={<ArrowForwardIcon />}
                  sx={{ color: 'common.white', fontWeight: 800 }}
                >
                  Xem tất cả
                </Button>
              )}
            </Stack>

            {courses.length === 0 ? (
              <Box
                sx={{
                  minHeight: 330,
                  display: 'grid',
                  placeItems: 'center',
                  textAlign: 'center',
                  p: 4,
                  border: '1px dashed #CCD2DB',
                  borderRadius: '8px',
                  bgcolor: '#FFFFFF',
                }}
              >
                <Box>
                  <MenuBookOutlinedIcon sx={{ fontSize: 54, color: '#A6AFBC', mb: 1.5 }} />
                  <Typography variant="h6" sx={{ color: '#172033', fontWeight: 900, mb: 1 }}>
                    Hành trình JLPT đang chờ bạn
                  </Typography>
                  <Typography sx={{ color: '#667085', maxWidth: 430, mx: 'auto', mb: 3 }}>
                    Khám phá các khóa học đã xuất bản và chọn lộ trình phù hợp với mục tiêu của bạn.
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => navigate(ROUTES.STUDENT.BROWSE_COURSES)}
                    sx={{
                      bgcolor: BRAND_COLORS.red,
                      fontWeight: 800,
                      '&:hover': { bgcolor: '#A71931' },
                    }}
                  >
                    Khám phá khóa học
                  </Button>
                </Box>
              </Box>
            ) : (
              <Grid container spacing={2.5}>
                {courses.map((course) => (
                  <Grid size={{ xs: 12, md: 6 }} key={course.enrollmentId}>
                    <StudentCourseCard course={course} />
                  </Grid>
                ))}
              </Grid>
            )}
          </Grid>

          <Grid size={{ xs: 12, lg: 3.5 }}>
            <Typography variant="h6" sx={{ color: '#172033', fontWeight: 900, mb: 2 }}>
              Mục tiêu học tập
            </Typography>
            <Paper
              elevation={0}
              sx={{
                height: 'calc(100% - 40px)',
                minHeight: 330,
                p: 3,
                border: '1px solid #E4E7EC',
                borderRadius: '8px',
                bgcolor: '#FFFFFF',
              }}
            >
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="overline" sx={{ color: '#667085', fontWeight: 800 }}>
                  Cấp độ hướng tới
                </Typography>
                <Chip
                  label={profile?.jlptGoal ? `JLPT ${profile.jlptGoal}` : 'Chưa thiết lập'}
                  size="small"
                  sx={{
                    bgcolor: profile?.jlptGoal ? BRAND_COLORS.red : '#EEF2F6',
                    color: profile?.jlptGoal ? '#FFFFFF' : '#475467',
                    fontWeight: 900,
                    borderRadius: '6px',
                  }}
                />
              </Stack>

              <Box sx={{ my: 3, height: 1, bgcolor: '#EEF0F3' }} />

              <Stack spacing={1.25}>
                {[
                  'Kanji và từ vựng',
                  'Ngữ pháp',
                  'Đọc hiểu và nghe',
                ].map((skill) => (
                  <Button
                    key={skill}
                    fullWidth
                    variant="outlined"
                    onClick={() => navigate(ROUTES.STUDENT.BROWSE_COURSES)}
                    endIcon={<ArrowForwardIcon />}
                    sx={{
                      minHeight: 48,
                      justifyContent: 'space-between',
                      borderColor: '#E1E5EA',
                      color: '#303846',
                      fontWeight: 700,
                      '&:hover': {
                        borderColor: '#F2A4B1',
                        color: BRAND_COLORS.red,
                        bgcolor: '#FFF6F7',
                      },
                    }}
                  >
                    {skill}
                  </Button>
                ))}
              </Stack>

              <Stack direction="row" spacing={1.25} sx={{ mt: 3, alignItems: 'center' }}>
                <AutoStoriesOutlinedIcon sx={{ color: BRAND_COLORS.green }} />
                <Typography variant="body2" sx={{ color: '#667085', lineHeight: 1.55 }}>
                  Chọn kỹ năng bạn muốn cải thiện để tìm khóa học phù hợp với mục tiêu.
                </Typography>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
