import React from 'react';
import { Box, Chip, Pagination, Stack, Typography } from '@mui/material';
import { EmptyState } from '../../../shared/components/EmptyState/EmptyState';
import { ErrorState } from '../../../shared/components/ErrorState/ErrorState';
import { LoadingState } from '../../../shared/components/LoadingState/LoadingState';
import { PAYOUT_STATUS_LABELS, WITHDRAWAL_STATUS_LABELS } from '../constants/walletLabels';
import type {
  PayoutSettlementStatus,
  WithdrawalRequestItem,
  WithdrawalRequestStatus,
} from '../types/walletTypes';
import { formatDateTime, formatMoney } from '../utils/walletFormat';

const GRID_TEMPLATE = '2fr 1.6fr 1.6fr 1.6fr 2fr';

const headerCellSx = {
  fontWeight: 600,
  color: 'text.secondary',
  textTransform: 'uppercase' as const,
  fontSize: '0.7rem',
  letterSpacing: '0.05em',
};

const WITHDRAWAL_COLORS: Record<WithdrawalRequestStatus, { bg: string; fg: string }> = {
  PENDING: { bg: '#fef3c7', fg: '#92400e' },
  APPROVED: { bg: '#dbeafe', fg: '#1e40af' },
  REJECTED: { bg: '#fee2e2', fg: '#991b1b' },
  EXECUTED: { bg: '#dcfce7', fg: '#166534' },
  FAILED: { bg: '#fee2e2', fg: '#991b1b' },
};

const PAYOUT_COLORS: Record<PayoutSettlementStatus, { bg: string; fg: string }> = {
  PENDING: { bg: '#fef3c7', fg: '#92400e' },
  SUCCESS: { bg: '#dcfce7', fg: '#166534' },
  FAILED: { bg: '#fee2e2', fg: '#991b1b' },
  RECONCILIATION_MISMATCH: { bg: '#ffedd5', fg: '#9a3412' },
};

interface WithdrawalHistoryProps {
  withdrawals: WithdrawalRequestItem[];
  currency: string;
  page: number;
  totalPages: number;
  isLoading: boolean;
  isError: boolean;
  onPageChange: (page: number) => void;
  onRetry: () => void;
}

/**
 * UC-17 step 5: withdrawal history and the payout status of each request.
 *
 * Read-only. Creating a withdrawal belongs to UC-27 and the settlement decision
 * to UC-33, so this component never exposes an action.
 */
export const WithdrawalHistory: React.FC<WithdrawalHistoryProps> = ({
  withdrawals,
  currency,
  page,
  totalPages,
  isLoading,
  isError,
  onPageChange,
  onRetry,
}) => {
  const renderBody = () => {
    if (isLoading) {
      return <LoadingState message="Đang tải lịch sử rút tiền..." />;
    }

    if (isError) {
      return <ErrorState message="Không tải được lịch sử rút tiền." onRetry={onRetry} />;
    }

    if (withdrawals.length === 0) {
      return (
        <EmptyState
          title="Chưa có yêu cầu rút tiền"
          description="Các yêu cầu rút tiền và trạng thái chi trả sẽ hiển thị tại đây."
        />
      );
    }

    return withdrawals.map((item, index) => {
      const statusPalette = WITHDRAWAL_COLORS[item.status];
      const payoutPalette = item.payoutStatus ? PAYOUT_COLORS[item.payoutStatus] : null;

      return (
        <Box
          key={item.id}
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: GRID_TEMPLATE },
            gap: { xs: 0.75, md: 2 },
            px: { xs: 2, md: 3 },
            py: 2,
            alignItems: 'center',
            borderBottom: index < withdrawals.length - 1 ? '1px solid' : 'none',
            borderColor: 'divider',
            '&:hover': { bgcolor: '#fafafa' },
          }}
        >
          <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
            {formatDateTime(item.requestedAt)}
          </Typography>

          <Typography sx={{ fontWeight: 700, fontSize: '0.875rem' }}>
            {formatMoney(item.amount, currency)}
          </Typography>

          <Box>
            <Chip
              size="small"
              label={WITHDRAWAL_STATUS_LABELS[item.status]}
              sx={{
                fontWeight: 700,
                fontSize: '0.72rem',
                bgcolor: statusPalette.bg,
                color: statusPalette.fg,
              }}
            />
          </Box>

          <Box>
            {payoutPalette && item.payoutStatus ? (
              <Chip
                size="small"
                label={PAYOUT_STATUS_LABELS[item.payoutStatus]}
                sx={{
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  bgcolor: payoutPalette.bg,
                  color: payoutPalette.fg,
                }}
              />
            ) : (
              <Typography sx={{ fontSize: '0.8rem', color: 'text.disabled' }}>
                Chưa chi trả
              </Typography>
            )}
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
              {item.decisionNote ?? '—'}
            </Typography>
            {item.payoutExecutedAt && (
              <Typography sx={{ fontSize: '0.75rem', color: 'text.disabled' }}>
                Chi trả lúc {formatDateTime(item.payoutExecutedAt)}
              </Typography>
            )}
          </Box>
        </Box>
      );
    });
  };

  return (
    <Stack sx={{ gap: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
        Lịch sử rút tiền &amp; chi trả
      </Typography>

      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
        <Box
          sx={{
            display: { xs: 'none', md: 'grid' },
            gridTemplateColumns: GRID_TEMPLATE,
            gap: 2,
            px: 3,
            py: 2,
            bgcolor: '#f8fafc',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography sx={headerCellSx}>Ngày yêu cầu</Typography>
          <Typography sx={headerCellSx}>Số tiền</Typography>
          <Typography sx={headerCellSx}>Trạng thái</Typography>
          <Typography sx={headerCellSx}>Chi trả</Typography>
          <Typography sx={headerCellSx}>Ghi chú</Typography>
        </Box>

        {renderBody()}
      </Box>

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1 }}>
          <Pagination
            count={totalPages}
            page={page + 1}
            onChange={(_, value) => onPageChange(value - 1)}
            shape="rounded"
            color="primary"
          />
        </Box>
      )}
    </Stack>
  );
};
