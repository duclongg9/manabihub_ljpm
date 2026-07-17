import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Paper, CircularProgress, Alert, Button, Stack, Card, CardContent, Divider } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import RuleIcon from '@mui/icons-material/Rule';
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { adminKycService } from '../../admin-kyc/services/adminKycService';
import type { KycRequestResponse } from '../../admin-kyc/services/adminKycService';
import { courseApprovalService } from '../../admin-course-approval/services/courseApprovalService';
import type { CourseApproval } from '../../admin-course-approval/types';
import { getAuthSession, hasAnyRole } from '../../../shared/auth/authSession';
import { ROUTES } from '../../../shared/constants/routes';
import { ROLES } from '../../../shared/constants/roles';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const session = getAuthSession('admin');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kycQueue, setKycQueue] = useState<KycRequestResponse[]>([]);
  const [courseQueue, setCourseQueue] = useState<CourseApproval[]>([]);

  const isCourseManager = session ? hasAnyRole(session, [ROLES.COURSE_MANAGER]) : false;

  useEffect(() => {
    const loadData = async () => {
      if (!isCourseManager) return;

      setLoading(true);
      setError(null);
      try {
        const [kycData, courseData] = await Promise.all([
          adminKycService.getPendingKycQueue(),
          courseApprovalService.getQueue()
        ]);
        setKycQueue(kycData);
        setCourseQueue(courseData);
      } catch {
        setError('Không thể tải dữ liệu hàng đợi. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isCourseManager]);

  if (!session) {
    return null;
  }

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Trung tâm Quản trị viên</Typography>
      </Stack>

      {!isCourseManager ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <SpaceDashboardIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Trang tổng quan hệ thống
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Chào mừng bạn đến với trung tâm quản trị. Chọn một chức năng từ menu bên trái để bắt đầu.
          </Typography>
        </Paper>
      ) : (
        <>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} action={<Button color="inherit" size="small" onClick={() => window.location.reload()}>Thử lại</Button>}>
              {error}
            </Alert>
          )}

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1, pb: 0 }}>
                  <Stack direction="row" sx={{ alignItems: 'center', gap: 2, mb: 2 }}>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'primary.light', color: 'primary.dark', display: 'flex' }}>
                      <FactCheckIcon />
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Kiểm duyệt KYC Giáo viên</Typography>
                      <Typography variant="body2" color="text.secondary">Hồ sơ chờ xác minh</Typography>
                    </Box>
                  </Stack>
                  <Box sx={{ my: 4, textAlign: 'center' }}>
                    {loading ? (
                      <CircularProgress />
                    ) : (
                      <Typography variant="h2" color="primary.main" sx={{ fontWeight: 'bold' }}>
                        {kycQueue.filter(k => k.status === 'PENDING').length}
                      </Typography>
                    )}
                  </Box>
                </CardContent>
                <Divider />
                <Box sx={{ p: 2 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => navigate(ROUTES.ADMIN.KYC_REVIEW)}
                  >
                    Đến hàng đợi KYC
                  </Button>
                </Box>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1, pb: 0 }}>
                  <Stack direction="row" sx={{ alignItems: 'center', gap: 2, mb: 2 }}>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'secondary.light', color: 'secondary.dark', display: 'flex' }}>
                      <RuleIcon />
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Phê duyệt Khóa học</Typography>
                      <Typography variant="body2" color="text.secondary">Khóa học chờ duyệt xuất bản</Typography>
                    </Box>
                  </Stack>
                  <Box sx={{ my: 4, textAlign: 'center' }}>
                    {loading ? (
                      <CircularProgress />
                    ) : (
                      <Typography variant="h2" color="secondary.main" sx={{ fontWeight: 'bold' }}>
                        {courseQueue.filter(c => c.status === 'PENDING').length}
                      </Typography>
                    )}
                  </Box>
                </CardContent>
                <Divider />
                <Box sx={{ p: 2 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="secondary"
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => navigate(ROUTES.ADMIN.TASK_QUEUE)}
                  >
                    Đến hàng đợi Khóa học
                  </Button>
                </Box>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};
