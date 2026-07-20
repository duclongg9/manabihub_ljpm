import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Stack,
  Typography,
  Box,
  Rating,
} from '@mui/material';
import BookIcon from '@mui/icons-material/MenuBook';
import ImageNotSupportedOutlinedIcon from '@mui/icons-material/ImageNotSupportedOutlined';
import type { PublicCourseSummary } from '../types/catalogTypes';

interface CourseCatalogCardProps {
  course: PublicCourseSummary;
  viewMode: 'grid' | 'list';
}

const JLPT_COLORS: Record<string, string> = {
  N5: '#4caf50',
  N4: '#8bc34a',
  N3: '#ff9800',
  N2: '#f44336',
  N1: '#9c27b0',
};

export const CourseCatalogCard: React.FC<CourseCatalogCardProps> = ({ course, viewMode }) => {
  const navigate = useNavigate();
  const [imageFailed, setImageFailed] = useState(false);

  const formatPrice = (price: number, currency: string) => {
    if (price === 0) return 'Miễn phí';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency || 'VND',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const avgRating = course.averageRating || 0;
  const totalReviews = course.totalReviews || 0;

  const isList = viewMode === 'list';

  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: isList ? { xs: 'column', sm: 'row' } : 'column',
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.4s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 20px 40px -15px rgba(0,0,0,0.1)',
          borderColor: 'primary.light',
        },
        '&:focus-within': {
          borderColor: 'primary.main',
        },
      }}
    >
      <CardActionArea
        onClick={() => navigate(`/courses/${course.slug || course.id}`)}
        sx={{
          display: 'flex',
          flexDirection: isList ? { xs: 'column', sm: 'row' } : 'column',
          alignItems: 'stretch',
          height: '100%',
          flexGrow: 1,
          '&:focus-visible': {
            outline: '3px solid',
            outlineColor: 'primary.main',
            outlineOffset: '2px',
          },
        }}
      >
        {/* Thumbnail Area */}
        <Box
          sx={{
            position: 'relative',
            width: isList ? { xs: '100%', sm: 280 } : '100%',
            flexShrink: 0,
            paddingTop: isList ? { xs: '56.25%', sm: 0 } : '56.25%', // 16:9 aspect ratio
            bgcolor: 'grey.50',
            overflow: 'hidden',
          }}
        >
          {!imageFailed && course.thumbnailUrl ? (
            <Box
              component="img"
              src={course.thumbnailUrl}
              alt=""
              onError={() => setImageFailed(true)}
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                '.MuiCardActionArea-root:hover &': {
                  transform: 'scale(1.05)',
                },
              }}
            />
          ) : (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'text.disabled',
              }}
            >
              <ImageNotSupportedOutlinedIcon sx={{ fontSize: 48, opacity: 0.5 }} />
            </Box>
          )}

          {/* Badges */}
          <Box sx={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 1 }}>
            {course.jlptLevel && (
              <Chip
                label={course.jlptLevel}
                size="small"
                sx={{
                  bgcolor: JLPT_COLORS[course.jlptLevel] || 'grey.800',
                  color: 'white',
                  fontWeight: 800,
                  fontSize: '0.7rem',
                  backdropFilter: 'blur(4px)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                }}
              />
            )}
          </Box>

        </Box>

        {/* Content Area */}
        <CardContent
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            p: 3,
            '&:last-child': { pb: 3 }, // override MUI default
          }}
        >
          {course.category && (
            <Typography
              variant="overline"
              sx={{ color: 'primary.main', fontWeight: 700, lineHeight: 1, mb: 1, display: 'block' }}
            >
              {course.category}
            </Typography>
          )}

          <Typography
            variant="h6"
            component="h3"
            sx={{
              fontWeight: 700,
              fontSize: isList ? '1.25rem' : '1.1rem',
              lineHeight: 1.4,
              mb: 1,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              color: 'text.primary',
              '.MuiCardActionArea-root:hover &': {
                color: 'primary.main',
              },
            }}
          >
            {course.title}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontWeight: 500 }}>
            {course.teacherName || 'Giảng viên ManabiHub'}
          </Typography>

          <Stack direction="row" spacing={1} sx={{ mb: 2, alignItems: 'center' }}>
            <Typography variant="subtitle2" sx={{ color: 'warning.main', fontWeight: 700 }}>
              {avgRating > 0 ? avgRating.toFixed(1) : 'Mới'}
            </Typography>
            <Rating value={avgRating} readOnly size="small" precision={0.5} sx={{ color: 'warning.main' }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
              ({totalReviews})
            </Typography>
          </Stack>

          <Box sx={{ mt: 'auto', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                color: course.price === 0 ? 'success.main' : 'text.primary',
                lineHeight: 1,
              }}
            >
              {formatPrice(course.price, course.currency)}
            </Typography>

            <Stack direction="row" spacing={0.5} sx={{ color: 'text.secondary', alignItems: 'center' }}>
              <BookIcon sx={{ fontSize: 16 }} />
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {course.totalLessons} bài học
              </Typography>
            </Stack>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};
