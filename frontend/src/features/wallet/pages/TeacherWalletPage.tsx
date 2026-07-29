import { Box, Typography, Chip } from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import LockClockIcon from '@mui/icons-material/LockClock';
import HistoryIcon from '@mui/icons-material/History';
import { PageHeader } from '../../../shared/components/PageHeader/PageHeader';
import { LoadingState } from '../../../shared/components/LoadingState/LoadingState';
import { ErrorState } from '../../../shared/components/ErrorState/ErrorState';
import { useTeacherWallet } from '../hooks/useTeacherWallet';
import { WalletStatCard } from '../components/WalletStatCard';
import { WalletActivityTable } from '../components/WalletActivityTable';
import { PendingEscrowTable } from '../components/PendingEscrowTable';
import { PAYOUT_STATUS_COLORS, PAYOUT_STATUS_LABELS, formatMoney } from '../utils';

export function TeacherWalletPage() {
  const {
    summary,
    isSummaryLoading,
    isSummaryError,
    refetchSummary,
    pendingEscrow,
    isEscrowLoading,
    isEscrowError,
    withdrawals,
    isWithdrawalsLoading,
    isWithdrawalsError,
  } = useTeacherWallet();

  const isLoading = isSummaryLoading || isEscrowLoading || isWithdrawalsLoading;
  const isError = isSummaryError || isEscrowError || isWithdrawalsError;

  return (
    <Box component="main" sx={{ minHeight: '100vh', bgcolor: '#FAF9F6', py: { xs: 3, md: 5 }, px: { xs: 2, sm: 3 } }}>
      <Box sx={{ maxWidth: '1280px', mx: 'auto', width: '100%', position: 'relative' }}>
        <Typography
          variant="h1"
          sx={{
            position: 'absolute', top: -40, right: -20, fontSize: '15rem', fontWeight: 900,
            color: 'rgba(0,0,0,0.025)', userSelect: 'none', pointerEvents: 'none', zIndex: 0,
            writingMode: 'vertical-rl',
          }}
        >
          財布
        </Typography>

        <PageHeader
          title={
            <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.5 }}>
              <span>Ví của tôi</span>
              {!isLoading && !isError && summary && (
                <Chip
                  size="small"
                  label={PAYOUT_STATUS_LABELS[summary.payoutStatus]}
                  color={PAYOUT_STATUS_COLORS[summary.payoutStatus]}
                  sx={{ fontWeight: 700 }}
                />
              )}
            </Box>
          }
          subtitle="マイウォレット"
          breadcrumbs={[{ label: 'Giáo viên' }, { label: 'Ví của tôi' }]}
        />

        <Box sx={{ position: 'relative', zIndex: 1 }}>
          {isLoading && <LoadingState message="Đang tải thông tin ví..." fullHeight />}

          {!isLoading && isError && (
            <ErrorState
              title="Không thể tải ví"
              message="Vui lòng kiểm tra kết nối và thử lại."
              onRetry={() => refetchSummary()}
            />
          )}

          {!isLoading && !isError && summary && (
            <>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
                <WalletStatCard
                  label="Số dư khả dụng"
                  value={formatMoney(summary.availableBalance, summary.currency)}
                  accent="#166534"
                  icon={<AccountBalanceWalletIcon fontSize="small" />}
                />
                <WalletStatCard
                  label="Đang tạm giữ (escrow)"
                  value={formatMoney(summary.pendingEscrowBalance, summary.currency)}
                  accent="#b45309"
                  icon={<LockClockIcon fontSize="small" />}
                />
                <WalletStatCard
                  label="Tổng đã rút"
                  value={formatMoney(summary.totalWithdrawn, summary.currency)}
                  icon={<HistoryIcon fontSize="small" />}
                />
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <Box>
                  <Box sx={{ mb: 1.5 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: 'grey.900' }}>
                      Đang tạm giữ (Escrow)
                    </Typography>
                    <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                      Doanh thu từ đơn hàng mới, chờ đủ điều kiện giải ngân
                    </Typography>
                  </Box>
                  <PendingEscrowTable items={pendingEscrow} />
                </Box>

                <Box>
                  <Box sx={{ mb: 1.5 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: 'grey.900' }}>
                      Lịch sử rút tiền
                    </Typography>
                    <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                      Các khoản đã rút khỏi ví
                    </Typography>
                  </Box>
                  <WalletActivityTable
                    items={withdrawals}
                    emptyTitle="Chưa có lượt rút tiền nào"
                    emptyDescription="Lịch sử rút tiền sẽ hiển thị tại đây sau khi bạn thực hiện rút tiền."
                  />
                </Box>
              </Box>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}
