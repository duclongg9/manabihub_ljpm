import React from 'react';
import { Box, Typography, Breadcrumbs, Link, Stack } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

interface PageHeaderProps {
  title: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, breadcrumbs, action }) => {
  return (
    <Box sx={{ mb: 4 }}>
      <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
          
          {breadcrumbs && breadcrumbs.length > 0 && (
            <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb">
              {breadcrumbs.map((bc, index) => {
                const isLast = index === breadcrumbs.length - 1;
                if (isLast || !bc.href) {
                  return (
                    <Typography key={index} color="text.primary" variant="body2">
                      {bc.label}
                    </Typography>
                  );
                }
                return (
                  <Link key={index} underline="hover" color="inherit" href={bc.href} variant="body2">
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
