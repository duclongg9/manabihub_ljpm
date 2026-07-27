import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, CircularProgress, Alert, Button, Stack, Card, CardContent, Divider } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import RuleIcon from '@mui/icons-material/Rule';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import SettingsApplicationsOutlinedIcon from '@mui/icons-material/SettingsApplicationsOutlined';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import { adminKycService } from '../../admin-kyc/services/adminKycService';
import type { KycRequestResponse } from '../../admin-kyc/services/adminKycService';
import { courseApprovalService } from '../../admin-course-approval/services/courseApprovalService';
import type { CourseApproval } from '../../admin-course-approval/types';
import { getAuthSession, hasAnyRole } from '../../../shared/auth/authSession';
import { ROUTES } from '../../../shared/constants/routes';
import { ROLES } from '../../../shared/constants/roles';
import { adminPayoutService } from '../../admin-payout/services/adminPayoutService';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const session = getAuthSession('admin');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kycQueue, setKycQueue] = useState<KycRequestResponse[]>([]);
  const [courseQueue, setCourseQueue] = useState<CourseApproval[]>([]);
  const [pendingPayouts, setPendingPayouts] = useState(0);
  const [reconciliationAlerts, setReconciliationAlerts] = useState(0);

  const isCourseManager = session ? hasAnyRole(session, [ROLES.COURSE_MANAGER]) : false;
  const isFinanceManager = session ? hasAnyRole(session, [ROLES.FINANCE_MANAGER]) : false;
  const isSystemAdmin = session ? hasAnyRole(session, [ROLES.SYSTEM_ADMIN]) : false;

  const loadData = React.useCallback(async () => {
    if (!isCourseManager && !isFinanceManager) return;

    setLoading(true);
    setError(null);
    try {
      if (isCourseManager) {
        const [kycData, courseData] = await Promise.all([
          adminKycService.getPendingKycQueue(),
          courseApprovalService.getQueue()
        ]);
        setKycQueue(kycData);
        setCourseQueue(courseData);
      }

      if (isFinanceManager) {
        const [pendingData, reconciliationData] = await Promise.all([
          adminPayoutService.getPayoutQueue({ page: 0, size: 1, status: 'PENDING' }),
          adminPayoutService.getPayoutQueue({
            page: 0,
            size: 1,
            reconciliationStatus: 'CRITICAL_MISMATCH',
          }),
        ]);
        setPendingPayouts(pendingData.totalElements);
        setReconciliationAlerts(reconciliationData.totalElements);
      }
    } catch {
      setError('Không thể tải dữ liệu vận hành. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [isCourseManager, isFinanceManager]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!session) {
    return null;
  }

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Trung tâm Quản trị viên</Typography>
      </Stack>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={<Button color="inherit" size="small" onClick={loadData}>Thử lại</Button>}
        >
          {error}
        </Alert>
      )}

      {isSystemAdmin ? (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <AdminActionCard
              title="Cấu hình hệ thống"
              subtitle="Giá, hoàn tiền, escrow, AI, kiểm tra khóa học và bảo mật đăng nhập"
              icon={<SettingsApplicationsOutlinedIcon />}
              actionLabel="Mở cấu hình"
              onAction={() => navigate(ROUTES.ADMIN.SYSTEM_SETTINGS)}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <AdminActionCard
              title="Phân quyền nội bộ"
              subtitle="Kiểm tra tài khoản và gán đúng một vai trò quản trị"
              icon={<ManageAccountsOutlinedIcon />}
              actionLabel="Quản lý vai trò"
              onAction={() => navigate(ROUTES.ADMIN.USERS)}
            />
          </Grid>
        </Grid>
      ) : isFinanceManager ? (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <OperationalQueueCard
              title="Yêu cầu chi trả chờ xử lý"
              subtitle="Các yêu cầu rút tiền cần Finance Manager xem xét"
              value={pendingPayouts}
              loading={loading}
              icon={<AccountBalanceOutlinedIcon />}
              actionLabel="Mở hàng đợi chi trả"
              onAction={() => navigate(ROUTES.ADMIN.PAYOUTS)}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <OperationalQueueCard
              title="Cảnh báo đối soát nghiêm trọng"
              subtitle="Sai lệch đang chặn việc thực hiện chi trả"
              value={reconciliationAlerts}
              loading={loading}
              icon={<WarningAmberOutlinedIcon />}
              actionLabel="Kiểm tra đối soát"
              onAction={() => navigate(ROUTES.ADMIN.PAYOUTS)}
            />
          </Grid>
        </Grid>
      ) : (
        <>
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
                    onClick={() => navigate(ROUTES.ADMIN.COURSE_APPROVAL)}
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

interface OperationalQueueCardProps {
  title: string;
  subtitle: string;
  value: number;
  loading: boolean;
  icon: React.ReactNode;
  actionLabel: string;
  onAction: () => void;
}

function OperationalQueueCard({
  title,
  subtitle,
  value,
  loading,
  icon,
  actionLabel,
  onAction,
}: OperationalQueueCardProps) {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Stack direction="row" sx={{ alignItems: 'center', gap: 2, mb: 3 }}>
          <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'action.hover', display: 'flex' }}>
            {icon}
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{title}</Typography>
            <Typography variant="body2" color="text.secondary">{subtitle}</Typography>
          </Box>
        </Stack>
        <Box sx={{ minHeight: 72, display: 'grid', placeItems: 'center' }}>
          {loading ? <CircularProgress size={36} /> : (
            <Typography variant="h2" sx={{ fontWeight: 800 }}>{value}</Typography>
          )}
        </Box>
      </CardContent>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Button fullWidth variant="outlined" endIcon={<ArrowForwardIcon />} onClick={onAction}>
          {actionLabel}
        </Button>
      </Box>
    </Card>
  );
}

function AdminActionCard({
  title,
  subtitle,
  icon,
  actionLabel,
  onAction,
}: Omit<OperationalQueueCardProps, 'loading' | 'value'>) {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Stack direction="row" sx={{ alignItems: 'flex-start', gap: 2 }}>
          <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'action.hover', display: 'flex' }}>
            {icon}
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{title}</Typography>
            <Typography variant="body2" color="text.secondary">{subtitle}</Typography>
          </Box>
        </Stack>
      </CardContent>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Button fullWidth variant="outlined" endIcon={<ArrowForwardIcon />} onClick={onAction}>
          {actionLabel}
        </Button>
      </Box>
    </Card>
  );
}
