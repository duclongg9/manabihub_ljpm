import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import {
  Box,
  Grid,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { CourseCatalogCard } from '../../catalog/components/CourseCatalogCard';
import { EmptyState } from '../../../shared/components/EmptyState/EmptyState';
import { ErrorState } from '../../../shared/components/ErrorState/ErrorState';
import { LoadingState } from '../../../shared/components/LoadingState/LoadingState';
import { ROUTES } from '../../../shared/constants/routes';
import { useWishlist } from '../hooks/useWishlist';
import { PageHeader } from '../../../shared/components/PageHeader/PageHeader';

export function StudentWishlistPage() {
  const navigate = useNavigate();
  const { data = [], isLoading, isError, refetch } = useWishlist();

  return (
    <Box component="main" sx={{ minHeight: '100vh', bgcolor: '#FAF9F6', py: { xs: 3, md: 5 }, px: { xs: 2, sm: 3 } }}>
      <Box sx={{ maxWidth: '1280px', mx: 'auto', width: '100%', position: 'relative' }}>
        <PageHeader
          title={
            <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.5 }}>
              <span>Danh sách yêu thích</span>
              <Box component="span" sx={{ px: 1.5, py: 0.25, bgcolor: '#fee2e2', color: '#dc2626', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 700, lineHeight: 1.5, minWidth: 24, textAlign: 'center' }}>
                {data.length}
              </Box>
            </Box>
          }
          subtitle="お気に入り"
          watermark="好"
          breadcrumbs={[
            { label: 'Học viên' },
            { label: 'Yêu thích' },
          ]}
        />

        {isLoading && <LoadingState message="Loading your wishlist..." />}

        {isError && (
          <ErrorState
            title="Wishlist unavailable"
            message="Please check your connection and try again."
            onRetry={() => refetch()}
          />
        )}

        {!isLoading && !isError && data.length === 0 && (
          <Box
            sx={{
              py: 6,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <EmptyState
              title="Chưa có khóa học yêu thích"
              description="Khám phá các khóa học và lưu lại những khóa học bạn quan tâm."
              icon={<FavoriteBorderIcon sx={{ fontSize: 56, color: 'text.secondary' }} />}
              actionLabel="Khám phá khóa học ngay ➔"
              onAction={() => navigate(ROUTES.PUBLIC.COURSE_BROWSE)}
            />
          </Box>
        )}

        {!isLoading && !isError && data.length > 0 && (
          <Grid container spacing={2.5}>
            {data.map((item) => (
              <Grid key={item.id} size={{ xs: 12, sm: 6, lg: 4, xl: 3 }}>
                <CourseCatalogCard
                  course={{
                    id: item.courseId,
                    title: item.title,
                    slug: item.slug,
                    thumbnailUrl: item.thumbnailUrl,
                    jlptLevel: item.jlptLevel,
                    category: item.category,
                    price: item.price,
                    currency: item.currency,
                    teacherName: item.teacherName,
                    totalLessons: item.totalLessons,
                  }}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
}
