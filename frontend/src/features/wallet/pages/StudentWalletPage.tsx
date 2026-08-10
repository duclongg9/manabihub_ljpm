import { useEffect, useState } from 'react';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Grid,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { DecorativeKanjiWatermark } from '../../../shared/components/DecorativeKanjiWatermark/DecorativeKanjiWatermark';
import { PageHeader } from '../../../shared/components/PageHeader/PageHeader';
import { getStudentWallet, topUpWallet } from '../services/studentWalletService';
import type { StudentWalletResponse } from '../types';

const MIN_TOPUP = 10000;
const MAX_TOPUP = 100000000;
const QUICK_AMOUNTS = [50000, 100000, 200000, 500000];

function formatMoney(value: number, currency = 'VND') {
  return `${value.toLocaleString('vi-VN')} ${currency}`;
}

function formatVnd(value: number) {
  return `${value.toLocaleString('vi-VN')} ₫`;
}

export const StudentWalletPage = () => {
  const [wallet, setWallet] = useState<StudentWalletResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState<number>(100000);
  const [processing, setProcessing] = useState(false);
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

  const handleTopUp = async () => {
    if (!amount || amount < MIN_TOPUP || amount > MAX_TOPUP || !Number.isInteger(amount)) {
      setError(
        `Số tiền nạp phải là số nguyên từ ${MIN_TOPUP.toLocaleString('vi-VN')} ₫ đến ${MAX_TOPUP.toLocaleString('vi-VN')} ₫.`,
      );
      return;
    }
    setProcessing(true);
    setError(null);
    try {
      const checkout = await topUpWallet(amount);
      if (checkout.paymentUrl) {
        window.location.href = checkout.paymentUrl;
      } else {
        setError('Không tạo được liên kết thanh toán. Vui lòng thử lại.');
        setProcessing(false);
      }
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(message || 'Không thể tạo yêu cầu nạp tiền. Vui lòng thử lại.');
      setProcessing(false);
    }
  };

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
                  sx={{
                    position: 'absolute',
                    right: -20,
                    top: -12,
                    fontSize: 190,
                    opacity: 0.08,
                    transform: 'rotate(-8deg)',
                  }}
                />

                <Stack spacing={2} sx={{ position: 'relative' }}>
                  <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                    <Box
                      sx={{
                        width: 42,
                        height: 42,
                        borderRadius: 2,
                        bgcolor: 'rgba(255, 255, 255, 0.15)',
                        display: 'grid',
                        placeItems: 'center',
                      }}
                    >
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
                      <Typography
                        component="p"
                        sx={{ fontSize: { xs: '2.25rem', md: '2.65rem' }, lineHeight: 1.15, fontWeight: 900 }}
                      >
                        {formatMoney(wallet?.availableBalance ?? 0, currency)}
                      </Typography>
                    )}
                  </Box>
                </Stack>

                <Stack
                  direction="row"
                  divider={<Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.2)' }} />}
                  sx={{ position: 'relative', pt: 2.5 }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.68)' }}>
                      Tổng số dư
                    </Typography>
                    <Typography sx={{ fontWeight: 800 }}>{formatMoney(wallet?.balance ?? 0, currency)}</Typography>
                  </Box>
                  <Box sx={{ flex: 1, pl: 3 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.68)' }}>
                      Đang xử lý
                    </Typography>
                    <Typography sx={{ fontWeight: 800 }}>{formatMoney(wallet?.frozenBalance ?? 0, currency)}</Typography>
                  </Box>
                </Stack>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 7 }}>
              <Box
                sx={{
                  height: '100%',
                  minHeight: { md: 360 },
                  border: '1px solid #E1E5EA',
                  borderRadius: 3,
                  bgcolor: '#fff',
                  overflow: 'hidden',
                  boxShadow: '0 8px 28px rgba(15, 23, 42, 0.05)',
                }}
              >
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', px: { xs: 2.5, md: 3 }, py: 2.5 }}>
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: 2,
                      bgcolor: '#FFF1F2',
                      color: '#C41E3A',
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    <PaymentsOutlinedIcon />
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 900 }}>Nạp tiền vào ví</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Chọn nhanh hoặc nhập số tiền bạn muốn nạp.
                    </Typography>
                  </Box>
                </Stack>

                <Divider />

                <Stack spacing={2.25} sx={{ px: { xs: 2.5, md: 3 }, py: 2.75 }}>
                  <Grid container spacing={1.25}>
                    {QUICK_AMOUNTS.map((value) => {
                      const selected = amount === value;
                      return (
                        <Grid key={value} size={{ xs: 6, sm: 3 }}>
                          <Button
                            fullWidth
                            variant={selected ? 'contained' : 'outlined'}
                            onClick={() => {
                              setAmount(value);
                              setError(null);
                            }}
                            aria-pressed={selected}
                            sx={{
                              minHeight: 44,
                              fontWeight: 800,
                              color: selected ? '#fff' : '#334155',
                              borderColor: selected ? 'primary.main' : '#CBD5E1',
                              bgcolor: selected ? 'primary.main' : '#fff',
                              '&:hover': {
                                borderColor: 'primary.main',
                                bgcolor: selected ? 'primary.dark' : '#FFF1F2',
                              },
                            }}
                          >
                            {formatVnd(value)}
                          </Button>
                        </Grid>
                      );
                    })}
                  </Grid>

                  <TextField
                    fullWidth
                    label="Số tiền nạp"
                    value={amount ? amount.toLocaleString('vi-VN') : ''}
                    onChange={(event) => {
                      const digits = event.target.value.replace(/\D/g, '');
                      setAmount(digits ? Number(digits) : 0);
                      setError(null);
                    }}
                    slotProps={{
                      htmlInput: {
                        inputMode: 'numeric',
                        'aria-label': 'Số tiền nạp vào ví',
                      },
                      input: {
                        endAdornment: <InputAdornment position="end">₫</InputAdornment>,
                      },
                    }}
                    helperText={`Tối thiểu ${formatVnd(MIN_TOPUP)} · Tối đa ${formatVnd(MAX_TOPUP)}`}
                  />

                  {error && <Alert severity="error">{error}</Alert>}

                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={() => void handleTopUp()}
                    disabled={processing}
                    startIcon={processing ? <CircularProgress size={18} color="inherit" /> : <PaymentsOutlinedIcon />}
                    sx={{ minHeight: 48, color: '#fff', fontWeight: 900 }}
                  >
                    {processing ? 'Đang kết nối VNPay…' : 'Nạp tiền qua VNPay'}
                  </Button>

                  <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', justifyContent: 'center' }}>
                    <LockOutlinedIcon sx={{ fontSize: 16, color: '#94A3B8' }} />
                    <Typography variant="caption" sx={{ color: '#94A3B8', textAlign: 'center' }}>
                      Giao dịch được xác nhận an toàn qua cổng thanh toán VNPay.
                    </Typography>
                  </Stack>
                </Stack>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Box>
  );
};

export default StudentWalletPage;
