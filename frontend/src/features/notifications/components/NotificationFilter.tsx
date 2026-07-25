import React from 'react';
import { Box, Chip, Stack } from '@mui/material';
import { NOTIFICATION_TYPES, NOTIFICATION_TYPE_KEYS } from '../types';
import type { ReadFilter } from '../types';

interface NotificationFilterProps {
  selectedType: string | null;
  onTypeChange: (type: string | null) => void;
  readFilter: ReadFilter;
  onReadFilterChange: (filter: ReadFilter) => void;
}

export const NotificationFilter: React.FC<NotificationFilterProps> = ({
  selectedType,
  onTypeChange,
  readFilter,
  onReadFilterChange,
}) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: { sm: 'center' }, justifyContent: 'space-between' }}>
      {/* Type filter chips */}
      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
        <Chip
          label="Tất cả loại"
          onClick={() => onTypeChange(null)}
          variant={selectedType === null ? 'filled' : 'outlined'}
          color={selectedType === null ? 'primary' : 'default'}
          sx={{
            fontWeight: selectedType === null ? 600 : 400,
            borderRadius: '8px',
            px: 0.5,
          }}
        />
        {NOTIFICATION_TYPE_KEYS.map((typeKey) => {
          const config = NOTIFICATION_TYPES[typeKey];
          const isSelected = selectedType === typeKey;
          return (
            <Chip
              key={typeKey}
              label={config.label}
              onClick={() => onTypeChange(typeKey)}
              variant={isSelected ? 'filled' : 'outlined'}
              sx={{
                fontWeight: isSelected ? 600 : 400,
                borderRadius: '8px',
                px: 0.5,
                ...(isSelected
                  ? {
                      bgcolor: config.color,
                      color: '#fff',
                      '&:hover': { bgcolor: config.color, opacity: 0.9 },
                    }
                  : {
                      borderColor: '#D1D5DB',
                      color: 'text.secondary',
                    }),
              }}
            />
          );
        })}
      </Stack>

      {/* Read status filter */}
      <Stack direction="row" spacing={1}>
        {([
          { key: 'ALL' as ReadFilter, label: 'Tất cả' },
          { key: 'UNREAD' as ReadFilter, label: 'Chưa đọc' },
          { key: 'READ' as ReadFilter, label: 'Đã đọc' },
        ]).map(({ key, label }) => (
          <Chip
            key={key}
            label={label}
            onClick={() => onReadFilterChange(key)}
            variant={readFilter === key ? 'filled' : 'outlined'}
            color={readFilter === key ? 'primary' : 'default'}
            sx={{
              fontWeight: readFilter === key ? 600 : 400,
              borderRadius: '8px',
              px: 0.5,
              ...(readFilter !== key && {
                borderColor: '#D1D5DB',
                color: 'text.secondary',
              }),
            }}
          />
        ))}
      </Stack>
    </Box>
  );
};
