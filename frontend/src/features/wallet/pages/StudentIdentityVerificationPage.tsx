import { useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../shared/constants/routes';
import { launchVnptIdentitySdk, resetVnptIdentitySdkRuntime } from '../../kyc/vnptIdentitySdk';
import { getStudentIdentityVerificationStatus, verifyStudentIdentity } from '../services/studentIdentityVerificationService';

export function StudentIdentityVerificationPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Awaited<ReturnType<typeof getStudentIdentityVerificationStatus>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const launchToken = useRef(0);

  useEffect(() => {
    void getStudentIdentityVerificationStatus()
      .then(setStatus)
      .catch(() => setError('Không tải được trạng thái xác minh. Vui lòng thử lại.'))
      .finally(() => setLoading(false));
    return () => {
      launchToken.current += 1;
      resetVnptIdentitySdkRuntime();
    };
  }, []);

  const startVerification = async () => {
    const token = ++launchToken.current;
    setError(null);
    setLaunching(true);
    try {
      await waitForSdkContainer();
      await launchVnptIdentitySdk(async (result) => {
        if (token !== launchToken.current) return;
        const verified = await verifyStudentIdentity(result);
        setStatus(verified);
        setLaunching(false);
      });
    } catch (verificationError) {
      if (token === launchToken.current) {
        setError(readErrorMessage(verificationError));
        setLaunching(false);
      }
    }
  };

  return (
    <Box component="main" sx={{ minHeight: '100%', bgcolor: '#FAF9F6', px: { xs: 2, md: 4 }, py: { xs: 3, md: 5 } }}>
      <Box sx={{ maxWidth: 760, mx: 'auto' }}>
        <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>Xác minh CCCD để rút tiền</Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Đây là luồng demo: VNPT eKYC đọc kết quả, sau đó hệ thống đối chiếu họ tên và ngày sinh với cơ sở dữ liệu CCCD giả lập của ManabiHub.
        </Typography>
        <Paper sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 3 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {loading ? <CircularProgress aria-label="Đang tải trạng thái xác minh" /> : (
            <Stack spacing={2}>
              <Alert severity={status?.verified ? 'success' : 'info'}>
                {status?.verified
                  ? `Đã xác minh${status.fullName ? `: ${status.fullName}` : ''}. Bạn có thể quay lại ví để tạo yêu cầu rút tiền.`
                  : 'Chưa xác minh. Hãy chuẩn bị CCCD gốc và thực hiện VNPT eKYC.'}
              </Alert>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Button variant="contained" onClick={() => void startVerification()} disabled={launching || status?.verified === true}>
                  {launching ? 'Đang mở VNPT eKYC…' : status?.verified ? 'Đã xác thực CCCD thành công' : 'Bắt đầu xác minh'}
                </Button>
                <Button variant="outlined" onClick={() => navigate(ROUTES.STUDENT.PAYMENTS)}>Quay lại lịch sử thanh toán</Button>
              </Stack>
              {launching && (
                <Box id="ekyc_sdk_intergrated" sx={{ minHeight: 520, bgcolor: '#111827', borderRadius: 2, overflow: 'hidden' }} />
              )}
            </Stack>
          )}
        </Paper>
      </Box>
    </Box>
  );
}

async function waitForSdkContainer() {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    if (document.getElementById('ekyc_sdk_intergrated')?.isConnected) return;
    await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
  }
  throw new Error('Không tìm thấy vùng hiển thị VNPT eKYC. Vui lòng thử lại.');
}

function readErrorMessage(error: unknown) {
  const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
  return message || (error instanceof Error ? error.message : 'Xác minh CCCD thất bại. Vui lòng thử lại.');
}

export default StudentIdentityVerificationPage;
