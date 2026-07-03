import React from 'react';
import { Box, Typography, Chip, IconButton, Paper } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { NOTIFICATION_TYPES } from '../types';
import type { NotificationResponse } from '../types';

interface NotificationItemProps {
  notification: NotificationResponse;
  onMarkAsRead: (id: string) => void;
}

function getRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return 'Vừa xong';
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 30) return `${diffDays} ngày trước`;
  return date.toLocaleDateString('vi-VN');
}

// Map notification type to an icon component
function getTypeIcon(type: string): string {
  return NOTIFICATION_TYPES[type]?.icon ?? '🔔';
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onMarkAsRead }) => {
  const typeConfig = NOTIFICATION_TYPES[notification.notificationType];
  const isUnread = !notification.read;

  return (
    <Paper
      elevation={0}
      onClick={() => {
        if (isUnread) {
          onMarkAsRead(notification.id);
        }
      }}
      sx={{
        p: 2.5,
        mb: 1.5,
        borderRadius: 3,
        border: '1px solid',
        borderColor: isUnread ? 'primary.light' : 'divider',
        bgcolor: isUnread ? 'rgba(79, 70, 229, 0.03)' : 'background.paper',
        cursor: isUnread ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: isUnread ? 'primary.main' : '#C5CAD3',
          transform: 'translateY(-1px)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        {/* Icon */}
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: typeConfig?.bgColor ?? '#F3F4F6',
            fontSize: '1.3rem',
            flexShrink: 0,
            mt: 0.25,
          }}
        >
          {getTypeIcon(notification.notificationType)}
        </Box>

        {/* Content */}
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            {/* Unread dot */}
            {isUnread && (
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  flexShrink: 0,
                }}
              />
            )}
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: isUnread ? 700 : 500,
                color: 'text.primary',
                lineHeight: 1.4,
              }}
            >
              {notification.title}
            </Typography>
            {/* QUAN TRỌNG badge for certain types */}
            {(notification.notificationType === 'PAYMENT' || notification.notificationType === 'REFUND') && (
              <Chip
                label="QUAN TRỌNG"
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  bgcolor: '#FEF3C7',
                  color: '#D97706',
                  borderRadius: '4px',
                }}
              />
            )}
          </Box>

          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              lineHeight: 1.6,
              mb: 1,
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 2,
              overflow: 'hidden',
            }}
          >
            {notification.message}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {typeConfig && (
              <Chip
                label={typeConfig.label}
                size="small"
                sx={{
                  height: 22,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  bgcolor: typeConfig.bgColor,
                  color: typeConfig.color,
                  borderRadius: '6px',
                }}
              />
            )}
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              {getRelativeTime(notification.createdAt)}
            </Typography>
          </Box>
        </Box>

        {/* Expand icon */}
        <IconButton size="small" sx={{ color: 'text.disabled', mt: 0.5 }}>
          <KeyboardArrowDownIcon fontSize="small" />
        </IconButton>
      </Box>
    </Paper>
  );
};
