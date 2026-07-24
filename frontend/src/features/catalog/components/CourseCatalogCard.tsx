import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Stack,
  Typography,
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import PersonIcon from '@mui/icons-material/Person';
import { getAsset } from '../../../shared/utils/assets';
import { resolvePublicAssetUrl } from '../../../shared/utils/assetUtils';
import { WishlistToggleButton } from '../../wishlist/components/WishlistToggleButton';
import type { PublicCourseSummary } from '../types/catalogTypes';

interface CourseCatalogCardProps {
  course: PublicCourseSummary;
}

function formatPrice(price: number, currency: string): string {
  if (price === 0) return 'Miễn phí';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: currency || 'VND',
    maximumFractionDigits: 0,
  }).format(price);
}

export const CourseCatalogCard: React.FC<CourseCatalogCardProps> = ({ course }) => {
  const navigate = useNavigate();
  const [imageFailed, setImageFailed] = useState(false);
  const thumbnailUrl = useMemo(
    () => resolvePublicAssetUrl(course.thumbnailUrl),
    [course.thumbnailUrl],
  );

  const idNum = parseInt(String(course.id).replace(/\D/g, '') || '0', 10);

  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        position: 'relative',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '16px',
        overflow: 'hidden',
        transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          '& .card-title': { color: '#C41E3A' },
          '& .card-cta': { opacity: 1, transform: 'translateX(0)', maxHeight: 20, mt: 0.5 },
          '& .card-price': { opacity: 0, maxHeight: 0, overflow: 'hidden' }
        },
      }}
    >
      <WishlistToggleButton courseId={course.id} variant="icon" />
      <CardActionArea
        aria-label={`Xem khóa học ${course.title}`}
        onClick={() => navigate(`/courses/${course.slug || course.id}`)}
        sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
      >
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            aspectRatio: '16 / 9',
            bgcolor: 'grey.100',
            overflow: 'hidden',
          }}
        >
          {thumbnailUrl && !imageFailed ? (
            <Box
              component="img"
              src={thumbnailUrl}
              alt={`Ảnh khóa học ${course.title}`}
              onError={() => setImageFailed(true)}
              sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <Box
              component="img"
              src={getAsset('hero.png')}
              alt="Mặc định"
              sx={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.95)' }}
            />
          )}
          {course.jlptLevel && (
            <Chip
              label={course.jlptLevel}
              size="small"
              sx={{ position: 'absolute', top: 12, left: 12, fontWeight: 700, bgcolor: '#C41E3A', color: 'white' }}
            />
          )}
        </Box>

        <CardContent
          sx={{
            width: '100%',
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            p: 2,
            '&:last-child': { pb: 2 },
          }}
        >
          {course.category && (
            <Typography variant="caption" color="primary.main" sx={{ mb: 0.5, fontWeight: 700 }}>
              {course.category}
            </Typography>
          )}
          <Typography
            className="card-title"
            component="h3"
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              lineHeight: 1.4,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              transition: 'color 0.2s',
            }}
          >
            {course.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, display: 'flex', alignItems: 'center', gap: 1 }}>
            {course.teacherName || 'Sensai Manabi'}
          </Typography>

          {/* Mock Trust Factors */}
          <Stack direction="row" sx={{ alignItems: 'center', mt: 1.5, gap: 1.5 }}>
            <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5 }}>
              <StarIcon sx={{ fontSize: 16, color: '#F59E0B' }} />
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#475569' }}>
                {(4 + (idNum % 10) / 10).toFixed(1)}
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                ({(idNum % 200) + 15})
              </Typography>
            </Stack>
            <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: '#cbd5e1' }} />
            <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5 }}>
              <PersonIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                {(idNum % 500) + 50} học viên
              </Typography>
            </Stack>
          </Stack>

          <Stack
            direction="row"
            spacing={1}
            sx={{ mt: 'auto', pt: 2, justifyContent: 'space-between', alignItems: 'flex-end' }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography
                className="card-price"
                variant="subtitle1"
                sx={{ fontWeight: 800, color: course.price === 0 ? 'success.main' : 'text.primary', transition: 'all 0.3s', maxHeight: 30 }}
              >
                {formatPrice(course.price, course.currency)}
              </Typography>
              <Typography 
                className="card-cta" 
                variant="caption" 
                sx={{ color: '#C41E3A', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 0.5, opacity: 0, transform: 'translateX(-10px)', transition: 'all 0.3s', maxHeight: 0 }}
              >
                 Khám phá ngay ➔
              </Typography>
            </Box>
            <Stack
              direction="row"
              spacing={0.5}
              sx={{ alignItems: 'center', color: '#64748b', bgcolor: '#f1f5f9', px: 1.5, py: 0.5, borderRadius: '8px' }}
            >
              <Typography variant="caption" sx={{ fontWeight: 600 }}>{course.totalLessons || (idNum % 20) + 12} bài học</Typography>
            </Stack>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};
