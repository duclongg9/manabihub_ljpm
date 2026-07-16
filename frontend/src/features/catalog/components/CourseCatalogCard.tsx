import React from 'react';
import {
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Chip,
  Stack,
  Typography,
  Box,
  Rating,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { useNavigate } from 'react-router-dom';
import type { PublicCourseSummary } from '../types/catalogTypes';

interface CourseCatalogCardProps {
  course: PublicCourseSummary;
}

const JLPT_COLORS: Record<string, string> = {
  N5: '#4caf50',
  N4: '#8bc34a',
  N3: '#ff9800',
  N2: '#f44336',
  N1: '#9c27b0',
};

export const CourseCatalogCard: React.FC<CourseCatalogCardProps> = ({ course }) => {
  const navigate = useNavigate();

  const formatPrice = (price: number, currency: string) => {
    if (price === 0) return 'Miễn phí';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency || 'VND',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleClick = () => {
    navigate(`/courses/${course.slug || course.id}`);
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        overflow: 'hidden',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 6,
        },
      }}
    >
      <CardActionArea
        onClick={handleClick}
        sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
      >
        <CardMedia
          component="img"
          height="160"
          image={course.thumbnailUrl || '/placeholder-course.png'}
          alt={course.title}
          sx={{
            objectFit: 'cover',
            bgcolor: 'grey.200',
          }}
          onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
            e.currentTarget.src = '';
            e.currentTarget.style.display = 'none';
          }}
        />

        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1, p: 2 }}>
          {/* JLPT Level + Category */}
          <Stack direction="row" spacing={0.5} useFlexGap sx={{ flexWrap: 'wrap' }}>
            {course.jlptLevel && (
              <Chip
                label={course.jlptLevel}
                size="small"
                sx={{
                  bgcolor: JLPT_COLORS[course.jlptLevel] || 'grey.500',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  height: 22,
                }}
              />
            )}
            {course.category && (
              <Chip
                label={course.category}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.7rem', height: 22 }}
              />
            )}
          </Stack>

          {/* Title */}
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 600,
              lineHeight: 1.3,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              minHeight: '2.6em',
            }}
          >
            {course.title}
          </Typography>

          {/* Teacher */}
          <Stack direction="row" sx={{ alignItems: 'center' }} spacing={0.5}>
            <SchoolIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary" noWrap>
              {course.teacherName || 'Giảng viên'}
            </Typography>
          </Stack>

          {/* Rating + Lessons */}
          <Stack direction="row" sx={{ alignItems: 'center' }} spacing={1}>
            <Rating
              value={course.averageRating}
              precision={0.5}
              size="small"
              readOnly
              sx={{ fontSize: '0.9rem' }}
            />
            <Typography variant="caption" color="text.secondary">
              ({course.totalReviews})
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Stack direction="row" sx={{ alignItems: 'center' }} spacing={0.3}>
              <MenuBookIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {course.totalLessons} bài
              </Typography>
            </Stack>
          </Stack>

          {/* Price */}
          <Box sx={{ mt: 'auto', pt: 1 }}>
            <Typography
              variant="h6"
              color={course.price === 0 ? 'success.main' : 'primary.main'}
              sx={{ fontWeight: 700, fontSize: '1.1rem' }}
            >
              {formatPrice(course.price, course.currency)}
            </Typography>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};
