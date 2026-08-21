import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { adminFinanceApi } from './adminFinanceApi';
import { getRevenueLoadErrorMessage } from './financeRevenueError';
import { reportingMonthRange } from './revenueReportingDate';
import type { MoneyValue, RevenueDashboard, RevenueGranularity, RevenuePoint } from './types';

function money(value: MoneyValue) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })
    .format(Number(value || 0));
}

function percentage(value: MoneyValue) {
  return `${Number(value || 0).toLocaleString('vi-VN', { maximumFractionDigits: 2 })}%`;
}

export function FinanceRevenueDashboardPage() {
  const defaultRange = useMemo(() => reportingMonthRange(new Date()), []);
  const [from, setFrom] = useState(defaultRange.from);
  const [to, setTo] = useState(defaultRange.to);
  const [granularity, setGranularity] = useState<RevenueGranularity>('DAY');
  const [dashboard, setDashboard] = useState<RevenueDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!from || !to || from > to) {
      setError('Khoảng thời gian không hợp lệ.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setDashboard(await adminFinanceApi.getRevenueDashboard({
        from: new Date(`${from}T00:00:00+07:00`).toISOString(),
        to: new Date(`${to}T23:59:59.999+07:00`).toISOString(),
        granularity,
      }));
    } catch (requestError) {
      setError(getRevenueLoadErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [from, to, granularity]);

  useEffect(() => { void load(); }, [load]);

  const summary = dashboard?.summary;
  const cards = summary ? [
    ['Doanh số thanh toán', money(summary.grossSales)],
    ['Doanh thu nền tảng', money(summary.platformRevenue)],
    ['Hoàn tiền', `${money(summary.refundAmount)} (${percentage(summary.refundRate)})`],
    ['Phí thanh toán', money(summary.paymentFees)],
    ['Chi phí vận hành', money(summary.operatingExpenses)],
    ['Kết quả vận hành ròng', money(summary.netOperatingResult)],
  ] : [];

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} sx={{ gap: 2, justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>Quản lý doanh thu hệ thống</Typography>
          <Typography color="text.secondary">
            Số liệu ghi nhận từ đơn thanh toán, hoàn tiền, hoa hồng và chi phí thực tế đã xác nhận.
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => void load()} disabled={loading}>
          Làm mới
        </Button>
      </Stack>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 2, alignItems: { sm: 'center' } }}>
            <TextField label="Từ ngày" type="date" value={from} onChange={(event) => setFrom(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
            <TextField label="Đến ngày" type="date" value={to} onChange={(event) => setTo(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
            <TextField select label="Nhóm theo" value={granularity} onChange={(event) => setGranularity(event.target.value as RevenueGranularity)} sx={{ minWidth: 160 }}>
              <MenuItem value="DAY">Ngày</MenuItem>
              <MenuItem value="WEEK">Tuần</MenuItem>
              <MenuItem value="MONTH">Tháng</MenuItem>
            </TextField>
          </Stack>
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {loading && !dashboard ? <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 300 }}><CircularProgress /></Box> : (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {cards.map(([label, value]) => (
              <Grid key={label} size={{ xs: 12, sm: 6, lg: 4 }}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">{label}</Typography>
                    <Typography variant="h6" sx={{ mt: 1, fontWeight: 800 }}>{value}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 750 }}>Biểu đồ theo thời gian</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Múi giờ báo cáo: {dashboard?.timezone ?? 'Asia/Ho_Chi_Minh'} · {dashboard?.summary.successfulOrders ?? 0} đơn thành công
              </Typography>
              <RevenueChart points={dashboard?.points ?? []} />
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
}

function RevenueChart({ points }: { points: RevenuePoint[] }) {
  const width = 1000;
  const height = 320;
  const pad = 48;
  const series = [
    { key: 'grossSales' as const, label: 'Doanh số', color: '#2563eb' },
    { key: 'platformRevenue' as const, label: 'Doanh thu nền tảng', color: '#16a34a' },
    { key: 'expenses' as const, label: 'Tổng chi phí', color: '#dc2626' },
  ];
  const values = points.flatMap((point) => [
    Number(point.grossSales),
    Number(point.platformRevenue),
    Number(point.paymentFees) + Number(point.operatingExpenses),
  ]);
  const chartMin = Math.min(...values, 0);
  const chartMax = Math.max(...values, 1);
  const chartSpan = Math.max(chartMax - chartMin, 1);
  const x = (index: number) => pad + (points.length <= 1 ? 0 : index * (width - pad * 2) / (points.length - 1));
  const y = (value: number) => pad + (chartMax - value) / chartSpan * (height - pad * 2);
  const pointsFor = (key: 'grossSales' | 'platformRevenue' | 'expenses') => points.map((point, index) => {
    const value = key === 'expenses'
      ? Number(point.paymentFees) + Number(point.operatingExpenses)
      : Number(point[key]);
    return `${x(index)},${y(value)}`;
  }).join(' ');

  if (points.length === 0) {
    return <Alert severity="info">Chưa có dữ liệu trong khoảng thời gian đã chọn.</Alert>;
  }

  return (
    <Box>
      <Box sx={{ overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ minWidth: 720, width: '100%', display: 'block' }} role="img" aria-label="Biểu đồ doanh thu theo thời gian">
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const tickValue = chartMin + chartSpan * ratio;
            return (
              <g key={ratio}>
                <line x1={pad} x2={width - pad} y1={y(tickValue)} y2={y(tickValue)} stroke={tickValue === 0 ? '#94a3b8' : '#e5e7eb'} />
                <text x={pad - 8} y={y(tickValue) + 4} textAnchor="end" fontSize="11" fill="#6b7280">
                  {new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(tickValue)}
                </text>
              </g>
            );
          })}
          {series.map((item) => (
            <polyline key={item.key} points={pointsFor(item.key)} fill="none" stroke={item.color} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
          ))}
          {points.map((point, index) => (
            (index === 0 || index === points.length - 1 || index % Math.max(1, Math.ceil(points.length / 6)) === 0) &&
            <text key={point.bucket} x={x(index)} y={height - 14} textAnchor="middle" fontSize="11" fill="#6b7280">{point.bucket.slice(5)}</text>
          ))}
        </svg>
      </Box>
      <Stack direction="row" sx={{ gap: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
        {series.map((item) => <Stack direction="row" sx={{ gap: 1, alignItems: 'center' }} key={item.key}><Box sx={{ width: 12, height: 4, bgcolor: item.color }} /><Typography variant="caption">{item.label}</Typography></Stack>)}
      </Stack>
    </Box>
  );
}
