import React from 'react';
import { Box, Button, Container, Grid, Stack, Typography } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AutoStoriesOutlinedIcon from '@mui/icons-material/AutoStoriesOutlined';
import { useNavigate } from 'react-router-dom';
import { CourseCatalogCard } from '../../../features/catalog/components/CourseCatalogCard';
import { useCourseCatalog } from '../../../features/catalog/hooks/useCourseCatalog';
import { ROUTES } from '../../../shared/constants/routes';

export const BestSellingCourses: React.FC = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useCourseCatalog({
    page: 0,
    size: 4,
    sort: 'publishedAt,desc',
  });

  const courses = data?.content ?? [];

  return (
    <Box component="section" sx={{ py: { xs: 7, md: 9 }, bgcolor: 'grey.50' }}>
      <Container maxWidth="xl">
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{
            mb: 4,
            alignItems: { xs: 'flex-start', md: 'flex-end' },
            justifyContent: 'space-between',
          }}
        >
          <Box>
            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: 'center', color: 'primary.main' }}
            >
              <AutoStoriesOutlinedIcon fontSize="small" />
              <Typography variant="overline" sx={{ fontWeight: 700 }}>
                NỘI DUNG MỚI
              </Typography>
            </Stack>
            <Typography component="h2" variant="h3" sx={{ mt: 0.5, fontWeight: 800 }}>
              Khóa học mới xuất bản
            </Typography>
          </Box>
          <Button
            variant="contained"
            endIcon={<ArrowForwardIcon />}
            onClick={() => navigate(ROUTES.PUBLIC.COURSE_BROWSE)}
          >
            Xem tất cả khóa học
          </Button>
        </Stack>

        {isLoading && (
          <Typography color="text.secondary" sx={{ py: 5 }}>
            Đang tải khóa học...
          </Typography>
        )}

        {isError && (
          <Typography color="error" sx={{ py: 5 }}>
            Chưa thể tải danh sách khóa học.
          </Typography>
        )}

        {!isLoading && !isError && courses.length === 0 && (
          <Typography color="text.secondary" sx={{ py: 5 }}>
            Chưa có khóa học được xuất bản.
          </Typography>
        )}

        {courses.length > 0 && (
          <Grid container spacing={2.5}>
            {courses.map((course) => (
              <Grid key={course.id} size={{ xs: 12, sm: 6, lg: 3 }}>
                <CourseCatalogCard course={course} />
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
};
