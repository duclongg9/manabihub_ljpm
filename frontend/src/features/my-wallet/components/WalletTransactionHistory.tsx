import React from 'react';
import {
  Box,
  Button,
  Chip,
  MenuItem,
  Pagination,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import { EmptyState } from '../../../shared/components/EmptyState/EmptyState';
import { ErrorState } from '../../../shared/components/ErrorState/ErrorState';
import { LoadingState } from '../../../shared/components/LoadingState/LoadingState';
import { TRANSACTION_TYPE_LABELS } from '../constants/walletLabels';
import type {
  WalletTransaction,
  WalletTransactionDirection,
  WalletTransactionType,
} from '../types/walletTypes';
import { formatDateTime, formatMoney, formatSignedMoney } from '../utils/walletFormat';

const GRID_TEMPLATE = '2.2fr 2.6fr 1.4fr 1.6fr 1.6fr';

const headerCellSx = {
  fontWeight: 600,
  color: 'text.secondary',
  textTransform: 'uppercase' as const,
  fontSize: '0.7rem',
  letterSpacing: '0.05em',
};

interface WalletTransactionHistoryProps {
  /** Transaction types the current role may filter by (BR-RBAC-01). */
  availableTypes: WalletTransactionType[];
  transactions: WalletTransaction[];
  currency: string;
  page: number;
  totalPages: number;
  isLoading: boolean;
  isError: boolean;
  typeFilter: WalletTransactionType | 'ALL';
  directionFilter: WalletTransactionDirection | 'ALL';
  onTypeFilterChange: (value: WalletTransactionType | 'ALL') => void;
  onDirectionFilterChange: (value: WalletTransactionDirection | 'ALL') => void;
  onPageChange: (page: number) => void;
  onRetry: () => void;
}

/**
 * UC-17 step 6: the transaction history the user filters.
 *
 * The type dropdown is built from `availableTypes`, which the page derives from
 * the active role, so a Student is never offered a Teacher revenue filter.
 */
export const WalletTransactionHistory: React.FC<WalletTransactionHistoryProps> = ({
  availableTypes,
  transactions,
  currency,
  page,
  totalPages,
  isLoading,
  isError,
  typeFilter,
  directionFilter,
  onTypeFilterChange,
  onDirectionFilterChange,
  onPageChange,
  onRetry,
}) => {
  const hasActiveFilter = typeFilter !== 'ALL' || directionFilter !== 'ALL';

  const renderBody = () => {
    if (isLoading) {
      return <LoadingState message="Đang tải lịch sử giao dịch..." />;
    }

    if (isError) {
      return (
        <ErrorState
          message="Không tải được lịch sử giao dịch."
          onRetry={onRetry}
        />
      );
    }

    if (transactions.length === 0) {
      return (
        <EmptyState
          title={hasActiveFilter ? 'Không có giao dịch phù hợp' : 'Chưa có giao dịch nào'}
          description={
            hasActiveFilter
              ? 'Thử bỏ bớt bộ lọc để xem thêm giao dịch.'
              : 'Các giao dịch ví của bạn sẽ hiển thị tại đây.'
          }
        />
      );
    }

    return transactions.map((transaction, index) => (
      <Box
        key={transaction.id}
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: GRID_TEMPLATE },
          gap: { xs: 0.75, md: 2 },
          px: { xs: 2, md: 3 },
          py: 2,
          alignItems: 'center',
          borderBottom: index < transactions.length - 1 ? '1px solid' : 'none',
          borderColor: 'divider',
          '&:hover': { bgcolor: '#fafafa' },
        }}
      >
        <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
          {formatDateTime(transaction.createdAt)}
        </Typography>

        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: 'grey.900' }}>
            {TRANSACTION_TYPE_LABELS[transaction.type] ?? transaction.type}
          </Typography>
          {transaction.note && (
            <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
              {transaction.note}
            </Typography>
          )}
        </Box>

        <Box>
          <Chip
            size="small"
            label={transaction.direction === 'IN' ? 'Tiền vào' : 'Tiền ra'}
            sx={{
              fontWeight: 700,
              fontSize: '0.72rem',
              bgcolor: transaction.direction === 'IN' ? '#dcfce7' : '#fee2e2',
              color: transaction.direction === 'IN' ? '#166534' : '#991b1b',
            }}
          />
        </Box>

        <Typography
          sx={{
            fontWeight: 700,
            fontSize: '0.875rem',
            textAlign: { xs: 'left', md: 'right' },
            color: transaction.direction === 'IN' ? '#166534' : '#991b1b',
          }}
        >
          {formatSignedMoney(transaction.amount, transaction.direction, currency)}
        </Typography>

        <Typography
          sx={{
            fontSize: '0.875rem',
            textAlign: { xs: 'left', md: 'right' },
            color: 'text.secondary',
          }}
        >
          {formatMoney(transaction.balanceAfter, currency)}
        </Typography>
      </Box>
    ));
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 1.5 }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
          Lịch sử giao dịch
        </Typography>

        <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
          <Select
            size="small"
            value={typeFilter}
            onChange={(event) =>
              onTypeFilterChange(event.target.value as WalletTransactionType | 'ALL')
            }
            sx={{ minWidth: 190, bgcolor: '#FFFFFF', borderRadius: 2 }}
          >
            <MenuItem value="ALL">Tất cả loại giao dịch</MenuItem>
            {availableTypes.map((type) => (
              <MenuItem key={type} value={type}>
                {TRANSACTION_TYPE_LABELS[type]}
              </MenuItem>
            ))}
          </Select>

          <Select
            size="small"
            value={directionFilter}
            onChange={(event) =>
              onDirectionFilterChange(event.target.value as WalletTransactionDirection | 'ALL')
            }
            sx={{ minWidth: 140, bgcolor: '#FFFFFF', borderRadius: 2 }}
          >
            <MenuItem value="ALL">Vào và ra</MenuItem>
            <MenuItem value="IN">Tiền vào</MenuItem>
            <MenuItem value="OUT">Tiền ra</MenuItem>
          </Select>

          {hasActiveFilter && (
            <Button
              size="small"
              onClick={() => {
                onTypeFilterChange('ALL');
                onDirectionFilterChange('ALL');
              }}
              sx={{ textTransform: 'none', fontWeight: 600, color: '#C41E3A' }}
            >
              Xóa bộ lọc
            </Button>
          )}
        </Stack>
      </Stack>

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
          <Typography sx={headerCellSx}>Thời gian</Typography>
          <Typography sx={headerCellSx}>Nội dung</Typography>
          <Typography sx={headerCellSx}>Chiều</Typography>
          <Typography sx={{ ...headerCellSx, textAlign: 'right' }}>Số tiền</Typography>
          <Typography sx={{ ...headerCellSx, textAlign: 'right' }}>Số dư sau</Typography>
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
    </Box>
  );
};
