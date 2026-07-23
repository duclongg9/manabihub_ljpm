import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
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
    <Box component="main" sx={{ minHeight: '100%', bgcolor: 'grey.50' }}>
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
        <Typography component="h1" variant="h4" sx={{ fontWeight: 800, mb: 3 }}>
          My Wishlist
        </Typography>

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
              title="Your wishlist is empty"
              description="Browse published courses and save the ones you want to revisit."
              icon={<FavoriteBorderIcon sx={{ fontSize: 56, color: 'text.secondary' }} />}
              actionLabel="Browse courses"
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
      </Container>
    </Box>
  );
}
