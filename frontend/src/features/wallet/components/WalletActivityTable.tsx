import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { EmptyState } from '../../../shared/components/EmptyState/EmptyState';
import type { WalletActivity } from '../types';
import { SECTION_LABELS, formatDateTime, formatMoney } from '../utils';

const GRID_TEMPLATE = '2fr 3fr 2fr 2fr 2fr';

const headerCellSx = {
  fontWeight: 600,
  color: 'text.secondary',
  textTransform: 'uppercase',
  fontSize: '0.7rem',
  letterSpacing: '0.05em',
};

interface WalletActivityTableProps {
  items: WalletActivity[];
  emptyTitle: string;
  emptyDescription: string;
}

export const WalletActivityTable: React.FC<WalletActivityTableProps> = ({
  items,
  emptyTitle,
  emptyDescription,
}) => {
  if (items.length === 0) {
    return (
      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: '#fff' }}>
        <EmptyState title={emptyTitle} description={emptyDescription} />
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
        <Typography sx={headerCellSx}>Ngày</Typography>
        <Typography sx={headerCellSx}>Loại giao dịch</Typography>
        <Typography sx={{ ...headerCellSx, textAlign: 'right' }}>Số tiền</Typography>
        <Typography sx={{ ...headerCellSx, textAlign: 'center' }}>Trạng thái</Typography>
        <Typography sx={headerCellSx}>Tham chiếu</Typography>
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
          <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
            {formatDateTime(item.occurredAt)}
          </Typography>
          <Box>
            <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
              {SECTION_LABELS[item.section]}
            </Typography>
            {item.note && (
              <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                {item.note}
              </Typography>
            )}
          </Box>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: '0.875rem',
              textAlign: 'right',
              color: item.direction === 'IN' ? '#166534' : '#9f1239',
            }}
          >
            {item.direction === 'IN' ? '+' : '-'}
            {formatMoney(item.amount, item.currency)}
          </Typography>
          <Box sx={{ textAlign: 'center' }}>
            <Chip size="small" label={item.status} sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
          </Box>
          <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
            {item.referenceCode ?? '—'}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};
