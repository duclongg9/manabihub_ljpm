import React from 'react';
import { Box, Typography } from '@mui/material';

interface WalletStatCardProps {
  label: string;
  value: string;
  accent?: string;
  icon?: React.ReactNode;
}

export const WalletStatCard: React.FC<WalletStatCardProps> = ({
  label,
  value,
  accent = '#0f172a',
  icon,
}) => {
  return (
    <Box
      sx={{
        flex: '1 1 200px',
        minWidth: 200,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        p: 2.5,
        bgcolor: '#fff',
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
        {icon}
        <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{label}</Typography>
      </Box>
      <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: accent }}>
        {value}
      </Typography>
    </Box>
  );
};
