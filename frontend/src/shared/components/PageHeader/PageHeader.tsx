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

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, watermark, breadcrumbs, action }) => {
  return (
    <Box sx={{ mb: 4, position: 'relative', overflow: 'hidden' }}>
      {watermark && (
        <Typography
          sx={{
            position: 'absolute',
            top: '50%',
            right: '5%',
            transform: 'translateY(-50%)',
            fontSize: { xs: '6rem', md: '10rem' },
            fontWeight: 900,
            color: 'rgba(0,0,0,0.03)',
            zIndex: 0,
            pointerEvents: 'none',
            userSelect: 'none',
            lineHeight: 1,
            whiteSpace: 'nowrap'
          }}
        >
          {watermark}
        </Typography>
      )}
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
            <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb" sx={{ mt: subtitle ? 1 : 0, '& ol': { listStyle: 'none', pl: 0, m: 0 } }}>
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
