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
import ImageNotSupportedOutlinedIcon from '@mui/icons-material/ImageNotSupportedOutlined';
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

  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        position: 'relative',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        overflow: 'hidden',
        transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          '& .card-title': { color: '#C41E3A' },
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
              role="img"
              aria-label={`Khóa học ${course.title} chưa có ảnh bìa`}
              sx={{
                width: '100%',
                height: '100%',
                display: 'grid',
                placeItems: 'center',
                color: 'text.disabled',
              }}
            >
              <ImageNotSupportedOutlinedIcon sx={{ fontSize: 44 }} />
            </Box>
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
            {course.teacherName || 'Giảng viên chưa cập nhật'}
          </Typography>

          <Stack
            direction="row"
            spacing={1}
            sx={{ mt: 'auto', pt: 2, justifyContent: 'space-between', alignItems: 'center' }}
          >
            <Typography
              className="card-price"
              variant="subtitle1"
              sx={{ fontWeight: 800, color: course.price === 0 ? 'success.main' : '#C41E3A' }}
            >
              {formatPrice(course.price, course.currency)}
            </Typography>
            <Box
              sx={{
                bgcolor: '#C41E3A',
                color: 'white',
                px: 1.5,
                py: 0.5,
                borderRadius: 2,
                fontSize: '0.875rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                transition: 'all 0.2s',
                '&:hover': { bgcolor: '#a01830' }
              }}
            >
              Thêm vào giỏ 🛒
            </Box>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};
