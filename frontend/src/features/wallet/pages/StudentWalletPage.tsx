import { useEffect, useState } from 'react';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import {
  Alert,
  Box,
  CircularProgress,
  Divider,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import { DecorativeKanjiWatermark } from '../../../shared/components/DecorativeKanjiWatermark/DecorativeKanjiWatermark';
import { PageHeader } from '../../../shared/components/PageHeader/PageHeader';
import { getStudentWallet } from '../services/studentWalletService';
import type { StudentWalletResponse } from '../types';
import { StudentWithdrawalPanel } from '../components/StudentWithdrawalPanel';

function formatMoney(value: number, currency = 'VND') {
  return `${value.toLocaleString('vi-VN')} ${currency}`;
}

export const StudentWalletPage = () => {
  const [wallet, setWallet] = useState<StudentWalletResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getStudentWallet()
      .then((data) => active && setWallet(data))
      .catch(() => active && setError('Không tải được số dư ví. Vui lòng thử lại.'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const currency = wallet?.currency ?? 'VND';

  return (
    <Box
      component="main"
      sx={{
        minHeight: '100%',
        bgcolor: '#FAF9F6',
        px: { xs: 2, md: 4 },
        py: { xs: 3, md: 5 },
      }}
    >
      <Box sx={{ maxWidth: 1180, mx: 'auto', position: 'relative', overflow: 'hidden' }}>
        <DecorativeKanjiWatermark text="財布" />

        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <PageHeader
            title="Ví của tôi"
            subtitle="お財布"
            breadcrumbs={[{ label: 'Học viên' }, { label: 'Ví của tôi' }]}
          />

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Grid container spacing={3} sx={{ alignItems: 'stretch' }}>
            <Grid size={{ xs: 12, md: 5 }}>
              <Box
                sx={{
                  position: 'relative',
                  height: '100%',
                  minHeight: { xs: 260, md: 360 },
                  overflow: 'hidden',
                  borderRadius: 3,
                  bgcolor: '#C41E3A',
                  backgroundImage: 'linear-gradient(145deg, #C41E3A 0%, #A5112C 100%)',
                  color: '#fff',
                  p: { xs: 3, md: 4 },
                  boxShadow: '0 18px 45px rgba(196, 30, 58, 0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <AccountBalanceWalletOutlinedIcon
                  aria-hidden="true"
                  sx={{ position: 'absolute', right: -20, top: -12, fontSize: 190, opacity: 0.08, transform: 'rotate(-8deg)' }}
                />
                <Stack spacing={2} sx={{ position: 'relative' }}>
                  <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                    <Box sx={{ width: 42, height: 42, borderRadius: 2, bgcolor: 'rgba(255, 255, 255, 0.15)', display: 'grid', placeItems: 'center' }}>
                      <AccountBalanceWalletOutlinedIcon />
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: 800 }}>Ví học viên</Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.72)' }}>
                        Số dư dùng để thanh toán khóa học
                      </Typography>
                    </Box>
                  </Stack>
                  <Box sx={{ pt: 2 }}>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.78)', mb: 0.75 }}>
                      Số dư khả dụng
                    </Typography>
                    {loading ? (
                      <CircularProgress size={34} sx={{ color: '#fff', my: 1 }} aria-label="Đang tải số dư ví" />
                    ) : (
                      <Typography component="p" sx={{ fontSize: { xs: '2.25rem', md: '2.65rem' }, lineHeight: 1.15, fontWeight: 900 }}>
                        {formatMoney(wallet?.availableBalance ?? 0, currency)}
                      </Typography>
                    )}
                  </Box>
                </Stack>
                <Stack direction="row" divider={<Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.2)' }} />} sx={{ position: 'relative', pt: 2.5 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.68)' }}>Tổng số dư</Typography>
                    <Typography sx={{ fontWeight: 800 }}>{formatMoney(wallet?.balance ?? 0, currency)}</Typography>
                  </Box>
                  <Box sx={{ flex: 1, pl: 3 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.68)' }}>Đang xử lý</Typography>
                    <Typography sx={{ fontWeight: 800 }}>{formatMoney(wallet?.frozenBalance ?? 0, currency)}</Typography>
                  </Box>
                </Stack>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 7 }}>
              <Box sx={{ height: '100%', minHeight: { md: 360 }, border: '1px solid #E1E5EA', borderRadius: 3, bgcolor: '#fff', overflow: 'hidden', boxShadow: '0 8px 28px rgba(15, 23, 42, 0.05)' }}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', px: { xs: 2.5, md: 3 }, py: 2.5 }}>
                  <Box sx={{ width: 42, height: 42, borderRadius: 2, bgcolor: '#FFF1F2', color: '#C41E3A', display: 'grid', placeItems: 'center' }}>
                    <ReceiptLongOutlinedIcon />
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 900 }}>Cách sử dụng ví</Typography>
                    <Typography variant="body2" color="text.secondary">Số dư ví chỉ phát sinh từ các khoản hoàn tiền hợp lệ.</Typography>
                  </Box>
                </Stack>
                <Divider />
                <Stack spacing={2.25} sx={{ px: { xs: 2.5, md: 3 }, py: 2.75 }}>
                  <Alert severity="info" icon={<LockOutlinedIcon />}>
                    ManabiHub không hỗ trợ nạp tiền trực tiếp vào ví để hạn chế rủi ro rửa tiền.
                  </Alert>
                  <Typography variant="body1">
                    Bạn có thể dùng số dư hoàn tiền để mua khóa học. Nếu muốn rút tiền, tài khoản cần xác thực số điện thoại và CCCD theo quy định.
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Lịch sử giao dịch, hoàn tiền và yêu cầu rút tiền được hiển thị trong mục Thanh toán của tôi.
                  </Typography>
                </Stack>
              </Box>
            </Grid>
          </Grid>

          {!loading && !error && (
            <StudentWithdrawalPanel
              wallet={wallet}
              minimumAmount={wallet?.minimumPayoutAmount ?? 100000}
              onChanged={async () => {
                try {
                  setWallet(await getStudentWallet());
                } catch {
                  setError('Không tải được số dư ví. Vui lòng thử lại.');
                }
              }}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default StudentWalletPage;
