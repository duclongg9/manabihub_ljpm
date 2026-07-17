import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ReplayIcon from '@mui/icons-material/Replay';
import SchoolIcon from '@mui/icons-material/School';
import { learningService } from '../services/learningService';
import type { MyCourse } from '../types';
import { ROUTES } from '../../../shared/constants/routes';

export function MyLearningPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<MyCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    learningService
      .getMyCourses()
      .then((data) => {
        if (active) setCourses(data);
      })
      .catch(() => {
        if (active) setError('Không thể tải danh sách khoá học của bạn. Vui lòng thử lại.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        My Learning
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Tiếp tục học các khoá học bạn đã đăng ký.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!error && courses.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
          <SchoolIcon sx={{ fontSize: 64, mb: 2, opacity: 0.4 }} />
          <Typography variant="h6">Bạn chưa đăng ký khoá học nào.</Typography>
          <Button
            variant="contained"
            sx={{ mt: 2 }}
            onClick={() => navigate(ROUTES.PUBLIC.COURSE_BROWSE)}
          >
            Khám phá khoá học
          </Button>
        </Box>
      )}

      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
        }}
      >
        {courses.map((course) => (
          <Card key={course.courseId} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardMedia
                component="img"
                height="150"
                image={course.thumbnailUrl || '/placeholder-course.png'}
                alt={course.courseTitle}
                sx={{ objectFit: 'cover', bgcolor: 'grey.100' }}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                  {course.levelCode && <Chip size="small" label={course.levelCode} color="primary" variant="outlined" />}
                  {course.courseCompleted && <Chip size="small" label="Hoàn thành" color="success" />}
                </Stack>
                <Typography variant="h6" fontWeight={600} gutterBottom noWrap title={course.courseTitle}>
                  {course.courseTitle}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {course.completedLessons}/{course.totalLessons} bài học · {course.progressPercent.toFixed(0)}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={course.progressPercent}
                  color={course.courseCompleted ? 'success' : 'primary'}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </CardContent>
              <CardActions sx={{ px: 2, pb: 2 }}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={course.courseCompleted ? <ReplayIcon /> : <PlayArrowIcon />}
                  onClick={() => navigate(ROUTES.STUDENT.COURSE_LEARN(course.courseId))}
                >
                  {course.courseCompleted ? 'Xem lại' : course.completedLessons > 0 ? 'Tiếp tục học' : 'Bắt đầu học'}
                </Button>
              </CardActions>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
