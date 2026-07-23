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
import MenuBookIcon from '@mui/icons-material/MenuBook';
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
        transition: 'transform 160ms ease, box-shadow 160ms ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 3,
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
              color="primary"
              sx={{ position: 'absolute', top: 10, left: 10, fontWeight: 700 }}
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
            component="h3"
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              lineHeight: 1.4,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {course.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
            {course.teacherName || 'Chưa cập nhật giảng viên'}
          </Typography>

          <Stack
            direction="row"
            spacing={1}
            sx={{ mt: 'auto', pt: 2, justifyContent: 'space-between', alignItems: 'flex-end' }}
          >
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 800, color: course.price === 0 ? 'success.main' : 'text.primary' }}
            >
              {formatPrice(course.price, course.currency)}
            </Typography>
            <Stack
              direction="row"
              spacing={0.5}
              sx={{ alignItems: 'center', color: 'text.secondary' }}
            >
              <MenuBookIcon sx={{ fontSize: 17 }} />
              <Typography variant="caption">{course.totalLessons} bài học</Typography>
            </Stack>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};
