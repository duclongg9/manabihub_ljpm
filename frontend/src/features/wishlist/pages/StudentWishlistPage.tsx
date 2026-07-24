
import {
  Box,
  Container,
  Grid,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { CourseCatalogCard } from '../../catalog/components/CourseCatalogCard';
import { EmptyState } from '../../../shared/components/EmptyState/EmptyState';
import { ErrorState } from '../../../shared/components/ErrorState/ErrorState';
import { LoadingState } from '../../../shared/components/LoadingState/LoadingState';
import { ROUTES } from '../../../shared/constants/routes';
import { useWishlist } from '../hooks/useWishlist';

export function StudentWishlistPage() {
  const navigate = useNavigate();
  const { data = [], isLoading, isError, refetch } = useWishlist();

  return (
    <Box component="main" sx={{ minHeight: '100%', bgcolor: 'grey.50', pb: 8 }}>
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 }, minHeight: '50vh', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Typography component="h1" variant="h4" sx={{ fontWeight: 800 }}>
            Danh sách yêu thích
          </Typography>
          {!isLoading && !isError && (
            <Box component="span" sx={{ ml: 2, px: 1.5, py: 0.25, borderRadius: '9999px', bgcolor: '#fee2e2', color: '#C41E3A', fontSize: '0.875rem', fontWeight: 700 }}>
              {data.length}
            </Box>
          )}
        </Box>

        {isLoading && <LoadingState message="Đang tải danh sách yêu thích..." />}

        {isError && (
          <ErrorState
            title="Không thể tải danh sách"
            message="Vui lòng kiểm tra kết nối và thử lại."
            onRetry={() => refetch()}
          />
        )}

        {!isLoading && !isError && data.length === 0 && (
          <Box
            sx={{
              py: 8,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 4,
              flexGrow: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <EmptyState
              title="Danh sách yêu thích của bạn đang trống!"
              description="Hãy khám phá thêm nhiều khóa học thú vị nhé."
              icon={<Box sx={{ fontSize: '5rem', mb: 2, filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.05))' }}>🐕</Box>}
              actionLabel="Khám phá khóa học ngay ➔"
              onAction={() => navigate(ROUTES.STUDENT.BROWSE_COURSES)}
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
      </Container>
    </Box>
  );
}
