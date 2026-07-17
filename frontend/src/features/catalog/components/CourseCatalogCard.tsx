import React, { useState } from 'react';
import {
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Stack,
  Typography,
  Box,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ImageNotSupportedOutlinedIcon from '@mui/icons-material/ImageNotSupportedOutlined';
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
  const [imageFailed, setImageFailed] = useState(false);

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
        {course.thumbnailUrl && !imageFailed ? (
          <Box
            component="img"
            src={course.thumbnailUrl}
            alt={course.title}
            onError={() => setImageFailed(true)}
            sx={{ width: '100%', height: 160, objectFit: 'cover', bgcolor: 'grey.100' }}
          />
        ) : (
          <Box
            role="img"
            aria-label={`Chưa có ảnh bìa cho ${course.title}`}
            sx={{
              height: 160,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'grey.100',
              color: 'text.disabled',
            }}
          >
            <ImageNotSupportedOutlinedIcon sx={{ fontSize: 48 }} />
          </Box>
        )}

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

          {/* Teacher + Lessons */}
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }} spacing={1}>
            <Stack direction="row" sx={{ alignItems: 'center' }} spacing={0.5}>
              <SchoolIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary" noWrap>
                {course.teacherName || 'Giảng viên'}
              </Typography>
            </Stack>
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
