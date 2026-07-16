import React, { useState } from 'react';
import { Box, Typography, Grid, CircularProgress, Alert, Pagination } from '@mui/material';
import { useStudentCourses } from '../hooks/useStudentCourses';
import { StudentCourseCard } from '../components/StudentCourseCard';

export const StudentCoursesPage: React.FC = () => {
  const [page, setPage] = useState(0);
  const pageSize = 12;

  const { data, isLoading, isError, error } = useStudentCourses(page, pageSize);

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value - 1);
  };

  if (isLoading && !data) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Error loading enrolled courses: {(error as Error).message}
        </Alert>
      </Box>
    );
  }

  const courses = data?.content || [];
  const totalPages = data?.totalPages || 0;

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
        My Learning
      </Typography>

      {courses.length === 0 ? (
        <Alert severity="info" sx={{ mt: 4 }}>
          You have not enrolled in any courses yet.
        </Alert>
      ) : (
        <>
          <Grid container spacing={3}>
            {courses.map((course: any) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={course.enrollmentId}>
                <StudentCourseCard course={course} />
              </Grid>
            ))}
          </Grid>

          {totalPages > 1 && (
            <Box sx={{ mt: 6, display: 'flex', justifyContent: 'center' }}>
              <Pagination 
                count={totalPages} 
                page={page + 1} 
                onChange={handlePageChange} 
                color="primary" 
                size="large"
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};
