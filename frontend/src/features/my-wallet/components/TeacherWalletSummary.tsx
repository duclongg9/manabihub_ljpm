import React from 'react';
import { Alert, Box, Stack, Typography } from '@mui/material';
import { walletMessage } from '../constants/walletLabels';
import type { TeacherWalletOverview } from '../types/walletTypes';
import { formatMoney } from '../utils/walletFormat';
import { WalletStatCard } from './WalletStatCard';

interface TeacherWalletSummaryProps {
  wallet: TeacherWalletOverview;
}

/**
 * UC-17 step 5: the Teacher sections — pending escrow, available balance and
 * withdrawal eligibility.
 *
 * NFR-UX-24: Pending Clearing and Available Balance are rendered as separate
 * cards with distinct accents and are never added together.
 */
export const TeacherWalletSummary: React.FC<TeacherWalletSummaryProps> = ({ wallet }) => (
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
        value={formatMoney(wallet.availableBalance, wallet.currency)}
        hint="Doanh thu đã qua kỳ đối soát và có thể yêu cầu rút."
        accent="#C41E3A"
        emphasis
      />
      <WalletStatCard
        label="Đang chờ đối soát"
        value={formatMoney(wallet.pendingEscrowAmount, wallet.currency)}
        hint="Doanh thu vẫn nằm trong kỳ giữ tiền, chưa được phép rút (BR-ESC-01)."
        accent="#f59e0b"
      />
      <WalletStatCard
        label="Đang giữ cho yêu cầu rút"
        value={formatMoney(wallet.reservedByWithdrawals, wallet.currency)}
        hint="Số tiền đã bị giữ lại bởi các yêu cầu rút đang chờ xử lý."
        accent="#6366f1"
      />
      <WalletStatCard
        label="Có thể rút ngay"
        value={formatMoney(wallet.withdrawableBalance, wallet.currency)}
        hint={`Ngưỡng rút tối thiểu: ${formatMoney(wallet.minimumPayoutThreshold, wallet.currency)}.`}
        accent={wallet.canRequestWithdrawal ? '#16a34a' : '#94a3b8'}
      />
    </Box>

    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
        gap: 2,
      }}
    >
      <WalletStatCard
        label="Tổng doanh thu đã nhận"
        value={formatMoney(wallet.totalRevenue, wallet.currency)}
        accent="#0ea5e9"
      />
      <WalletStatCard
        label="Tổng đã chi trả"
        value={formatMoney(wallet.totalPaidOut, wallet.currency)}
        accent="#0ea5e9"
      />
      <WalletStatCard
        label="Số dư bị phong tỏa"
        value={formatMoney(wallet.frozenBalance, wallet.currency)}
        hint="Phát sinh khi có quyết định kiểm duyệt hoặc tranh chấp (BR-WAL-03)."
        accent={wallet.walletFrozen ? '#dc2626' : '#94a3b8'}
      />
    </Box>

    {wallet.blockedMessageCode && (
      <Alert severity={wallet.walletFrozen ? 'error' : 'info'}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          Hiện chưa thể tạo yêu cầu rút tiền
        </Typography>
        <Typography variant="body2">{walletMessage(wallet.blockedMessageCode)}</Typography>
      </Alert>
    )}
  </Stack>
);
