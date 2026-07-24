import React from 'react';
import { Box, Typography, Breadcrumbs, Link, Stack } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: string;
  watermark?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, breadcrumbs, action }) => {
  return (
    <Box
      sx={{
        mb: 4,
        position: 'relative',
        overflow: 'hidden',
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 4,
        p: { xs: 3, md: 5 },
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)',
      }}
    >
      <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom={!subtitle} sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
          
          {subtitle && (
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2, fontWeight: 500 }}>
              {subtitle}
            </Typography>
          )}
          
          {breadcrumbs && breadcrumbs.length > 0 && (
            <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb" sx={{ mt: subtitle ? 1 : 0, '& ol': { listStyle: 'none', listStyleType: 'none', pl: 0, m: 0, display: 'flex', alignItems: 'center' }, '& li': { listStyle: 'none', listStyleType: 'none', pl: 0, m: 0, '&::before': { content: 'none' }, '&::marker': { content: 'none' } } }}>
              {breadcrumbs.map((bc, index) => {
                const isLast = index === breadcrumbs.length - 1;
                if (isLast || !bc.href) {
                  return (
                    <Typography key={index} color="text.primary" variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                      {bc.label}
                    </Typography>
                  );
                }
                return (
                  <Link key={index} underline="hover" color="inherit" href={bc.href} variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                    {bc.label}
                  </Link>
                );
              })}
            </Breadcrumbs>
          )}
        </Box>
        
        {action && (
          <Box sx={{ display: 'flex', gap: 2 }}>
            {action}
          </Box>
        )}
      </Stack>
    </Box>
  );
};
