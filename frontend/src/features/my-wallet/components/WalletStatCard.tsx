import React from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

interface WalletStatCardProps {
  label: string;
  value: string;
  /** Short explanation shown in a tooltip, e.g. why a balance is not withdrawable. */
  hint?: string;
  /** Accent colour of the left border; used to separate Pending from Available. */
  accent?: string;
  emphasis?: boolean;
}

/**
 * One figure of the wallet summary.
 *
 * NFR-UX-24 requires Pending and Available balance to read as clearly
 * different things, so each card carries its own accent and hint rather than
 * being rendered as an undifferentiated list of numbers.
 */
export const WalletStatCard: React.FC<WalletStatCardProps> = ({
  label,
  value,
  hint,
  accent = '#C41E3A',
  emphasis = false,
}) => (
  <Box
    sx={{
      p: { xs: 2, md: 2.5 },
      borderRadius: 3,
      bgcolor: '#FFFFFF',
      border: '1px solid',
      borderColor: 'divider',
      borderLeft: '4px solid',
      borderLeftColor: accent,
      display: 'flex',
      flexDirection: 'column',
      gap: 0.75,
      minWidth: 0,
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <Typography
        sx={{
          fontSize: '0.72rem',
          fontWeight: 600,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: 'text.secondary',
        }}
      >
        {label}
      </Typography>
      {hint && (
        <Tooltip title={hint} arrow>
          <InfoOutlinedIcon sx={{ fontSize: 14, color: 'text.disabled', cursor: 'help' }} />
        </Tooltip>
      )}
    </Box>
    <Typography
      sx={{
        fontWeight: 800,
        fontSize: emphasis ? { xs: '1.35rem', md: '1.6rem' } : '1.15rem',
        color: '#0f172a',
        wordBreak: 'break-word',
      }}
    >
      {value}
    </Typography>
  </Box>
);
