import React from 'react';
import { Box, Button, Chip, Stack, Typography } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import { TOP_UP_STATUS_LABELS } from '../constants/walletLabels';
import type { StudentWalletOverview, WalletTopUpStatus } from '../types/walletTypes';
import { formatDateTime, formatMoney } from '../utils/walletFormat';
import { WalletStatCard } from './WalletStatCard';

const TOP_UP_STATUS_COLORS: Record<WalletTopUpStatus, { bg: string; fg: string }> = {
  PENDING: { bg: '#fef3c7', fg: '#92400e' },
  SUCCEEDED: { bg: '#dcfce7', fg: '#166534' },
  FAILED: { bg: '#fee2e2', fg: '#991b1b' },
  CANCELLED: { bg: '#e2e8f0', fg: '#475569' },
};

interface StudentWalletSummaryProps {
  wallet: StudentWalletOverview;
  onTopUpClick: () => void;
}

/**
 * UC-17 step 4: the Student sections — balance, top-up, payment and refund.
 *
 * There is deliberately no withdrawal control here; a Student has no payout
 * balance and the backend rejects the action anyway (UC-17 exception 4b).
 */
export const StudentWalletSummary: React.FC<StudentWalletSummaryProps> = ({
  wallet,
  onTopUpClick,
}) => (
  <Stack sx={{ gap: 3 }}>
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
        gap: 2,
      }}
    >
      <WalletStatCard
        label="Số dư khả dụng"
        value={formatMoney(wallet.balance, wallet.currency)}
        hint="Số tiền bạn có thể dùng để thanh toán khóa học."
        accent="#C41E3A"
        emphasis
      />
      <WalletStatCard
        label="Đang chờ xác nhận nạp"
        value={formatMoney(wallet.pendingTopUpAmount, wallet.currency)}
        hint="Yêu cầu nạp đã tạo nhưng hệ thống chưa nhận xác nhận thanh toán."
        accent="#f59e0b"
      />
      <WalletStatCard
        label="Đã thanh toán khóa học"
        value={formatMoney(wallet.totalSpent, wallet.currency)}
        accent="#0ea5e9"
      />
      <WalletStatCard
        label="Đã được hoàn tiền"
        value={formatMoney(wallet.totalRefunded, wallet.currency)}
        accent="#16a34a"
      />
    </Box>

    <Box
      sx={{
        p: { xs: 2, md: 3 },
        borderRadius: 3,
        bgcolor: '#FFFFFF',
        border: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 1.5 }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
            Nạp ví
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Tổng đã nạp thành công: {formatMoney(wallet.totalToppedUp, wallet.currency)}
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddCircleOutlineIcon />}
          disabled={!wallet.canTopUp}
          onClick={onTopUpClick}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: 2.5,
            px: 3,
            bgcolor: '#C41E3A',
            '&:hover': { bgcolor: '#a01830' },
          }}
        >
          Nạp tiền
        </Button>
      </Stack>

      {wallet.recentTopUps.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Bạn chưa có yêu cầu nạp ví nào.
        </Typography>
      ) : (
        <Stack sx={{ gap: 1 }}>
          {wallet.recentTopUps.map((topUp) => {
            const palette = TOP_UP_STATUS_COLORS[topUp.status];
            return (
              <Stack
                key={topUp.id}
                direction={{ xs: 'column', sm: 'row' }}
                sx={{
                  gap: 1,
                  justifyContent: 'space-between',
                  alignItems: { sm: 'center' },
                  py: 1.25,
                  px: 1.5,
                  borderRadius: 2,
                  bgcolor: '#f8fafc',
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                    {topUp.referenceCode}
                  </Typography>
                  <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
                    {formatDateTime(topUp.createdAt)}
                  </Typography>
                </Box>

                <Stack direction="row" sx={{ gap: 1.5, alignItems: 'center' }}>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.875rem' }}>
                    {formatMoney(topUp.amount, topUp.currency)}
                  </Typography>
                  <Chip
                    size="small"
                    label={TOP_UP_STATUS_LABELS[topUp.status]}
                    sx={{ fontWeight: 700, fontSize: '0.72rem', bgcolor: palette.bg, color: palette.fg }}
                  />
                </Stack>
              </Stack>
            );
          })}
        </Stack>
      )}
    </Box>
  </Stack>
);
