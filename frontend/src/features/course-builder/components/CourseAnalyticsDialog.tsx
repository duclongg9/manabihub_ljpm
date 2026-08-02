import AssessmentIcon from '@mui/icons-material/Assessment';
import GroupIcon from '@mui/icons-material/Group';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PaymentsIcon from '@mui/icons-material/Payments';
import StarIcon from '@mui/icons-material/Star';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { fetchCourseAnalytics, type TeacherCourseAnalyticsResponse } from '../services/courseAnalyticsService';

interface CourseAnalyticsDialogProps {
  courseId: string | null;
  courseTitle: string | null;
  onClose: () => void;
}

const priceFormatter = new Intl.NumberFormat('vi-VN', {
  currency: 'VND',
  maximumFractionDigits: 0,
  style: 'currency',
});

export function CourseAnalyticsDialog({ courseId, courseTitle, onClose }: CourseAnalyticsDialogProps) {
  const [analytics, setAnalytics] = useState<TeacherCourseAnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId) {
      setAnalytics(null);
      setError(null);
      return;
    }

    let active = true;
    setIsLoading(true);
    setError(null);

    fetchCourseAnalytics(courseId)
      .then((data) => {
        if (active) setAnalytics(data);
      })
      .catch(() => {
        if (active) setError('Không thể tải dữ liệu thống kê. Vui lòng thử lại.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [courseId]);

  return (
    <Dialog
      open={Boolean(courseId)}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="course-analytics-dialog-title"
    >
      <DialogTitle
        id="course-analytics-dialog-title"
        component="div"
        sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 3, py: 2.5 }}
      >
        <Stack direction="row" spacing={1.75} sx={{ alignItems: 'center' }}>
          <Box
            sx={{
              alignItems: 'center',
              bgcolor: 'primary.light',
              borderRadius: 2,
              color: 'primary.dark',
              display: 'flex',
              height: 44,
              justifyContent: 'center',
              width: 44,
            }}
          >
            <AssessmentIcon />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Thống kê khóa học
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {courseTitle}
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {isLoading && (
          <Stack sx={{ alignItems: 'center', py: 5 }} spacing={2}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary">
              Đang tải dữ liệu...
            </Typography>
          </Stack>
        )}

        {!isLoading && error && (
          <Alert severity="error" sx={{ mb: 0 }}>
            {error}
          </Alert>
        )}

        {!isLoading && !error && analytics && (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                  <Box
                    sx={{
                      bgcolor: 'info.lighter',
                      color: 'info.main',
                      p: 1.5,
                      borderRadius: 2,
                    }}
                  >
                    <GroupIcon />
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Học viên đang học
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>
                      {analytics.activeStudents}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                  <Box
                    sx={{
                      bgcolor: 'success.lighter',
                      color: 'success.main',
                      p: 1.5,
                      borderRadius: 2,
                    }}
                  >
                    <EmojiEventsIcon />
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Học viên hoàn thành
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>
                      {analytics.completedStudents}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                  <Box
                    sx={{
                      bgcolor: 'warning.lighter',
                      color: 'warning.main',
                      p: 1.5,
                      borderRadius: 2,
                    }}
                  >
                    <PaymentsIcon />
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Tổng doanh thu thực
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>
                      {priceFormatter.format(analytics.totalRevenue)}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                  <Box
                    sx={{
                      bgcolor: 'primary.lighter',
                      color: 'primary.main',
                      p: 1.5,
                      borderRadius: 2,
                    }}
                  >
                    <StarIcon />
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Đánh giá trung bình
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>
                      {analytics.averageRating ? analytics.averageRating.toFixed(1) : '—'} 
                      <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                        ({analytics.totalReviews} lượt)
                      </Typography>
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        )}
      </DialogContent>

      <DialogActions sx={{ borderTop: '1px solid', borderColor: 'divider', px: 3, py: 2 }}>
        <Button onClick={onClose} sx={{ fontWeight: 700, textTransform: 'none' }}>
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
}
