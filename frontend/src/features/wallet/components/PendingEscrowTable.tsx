import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { EmptyState } from '../../../shared/components/EmptyState/EmptyState';
import type { EscrowEntry } from '../types';
import { formatDateTime, formatMoney } from '../utils';

const GRID_TEMPLATE = '3fr 2fr 2fr 2fr 2fr';

const headerCellSx = {
  fontWeight: 600,
  color: 'text.secondary',
  textTransform: 'uppercase',
  fontSize: '0.7rem',
  letterSpacing: '0.05em',
};

const STATUS_COLOR: Record<EscrowEntry['status'], 'warning' | 'success' | 'error' | 'default'> = {
  HELD: 'warning',
  FROZEN: 'warning',
  RELEASED: 'success',
  REFUNDED: 'error',
};

interface PendingEscrowTableProps {
  items: EscrowEntry[];
}

export const PendingEscrowTable: React.FC<PendingEscrowTableProps> = ({ items }) => {
  if (items.length === 0) {
    return (
      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: '#fff' }}>
        <EmptyState
          title="Không có khoản nào đang tạm giữ"
          description="Doanh thu từ các đơn hàng mới sẽ tạm giữ tại đây trước khi được giải ngân."
        />
      </Box>
    );
  }

  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: GRID_TEMPLATE,
          gap: 2,
          px: { xs: 2, md: 3 },
          py: 2,
          bgcolor: '#f8fafc',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography sx={headerCellSx}>Khóa học</Typography>
        <Typography sx={headerCellSx}>Đơn hàng</Typography>
        <Typography sx={{ ...headerCellSx, textAlign: 'right' }}>Số tiền</Typography>
        <Typography sx={{ ...headerCellSx, textAlign: 'center' }}>Trạng thái</Typography>
        <Typography sx={headerCellSx}>Ngày giải ngân dự kiến</Typography>
      </Box>

      {items.map((item, idx) => (
        <Box
          key={item.id}
          sx={{
            display: 'grid',
            gridTemplateColumns: GRID_TEMPLATE,
            gap: 2,
            px: { xs: 2, md: 3 },
            py: 2,
            alignItems: 'center',
            borderBottom: idx < items.length - 1 ? '1px solid' : 'none',
            borderColor: 'divider',
            '&:hover': { bgcolor: '#fafafa' },
          }}
        >
          <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
            {item.courseTitle ?? '—'}
          </Typography>
          <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
            {item.orderCode ?? '—'}
          </Typography>
          <Typography sx={{ fontWeight: 700, fontSize: '0.875rem', textAlign: 'right' }}>
            {formatMoney(item.amount, item.currency)}
          </Typography>
          <Box sx={{ textAlign: 'center' }}>
            <Chip
              size="small"
              label={item.status}
              color={STATUS_COLOR[item.status]}
              sx={{ fontWeight: 600, fontSize: '0.7rem' }}
            />
          </Box>
          <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
            {item.releaseAt ? formatDateTime(item.releaseAt) : '—'}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};
