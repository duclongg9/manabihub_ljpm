import React, { useState, useCallback } from 'react';
import { Box, Grid, Pagination, Typography, Stack } from '@mui/material';
import { useCourseCatalog } from '../hooks/useCourseCatalog';
import { useCourseCategories } from '../hooks/useCourseCategories';
import { CourseCatalogCard } from '../components/CourseCatalogCard';
import { CourseCatalogFiltersBar } from '../components/CourseCatalogFilters';
import { LoadingState } from '../../../shared/components/LoadingState/LoadingState';
import { EmptyState } from '../../../shared/components/EmptyState/EmptyState';
import { ErrorState } from '../../../shared/components/ErrorState/ErrorState';
import type { CourseCatalogFilters } from '../types/catalogTypes';
import SearchOffIcon from '@mui/icons-material/SearchOff';

const PAGE_SIZE = 12;

export const CourseCatalogPage: React.FC = () => {
  const [filters, setFilters] = useState<CourseCatalogFilters>({});
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState('publishedAt,desc');

  const { data: categoriesData, isLoading: categoriesLoading } = useCourseCategories();

  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useCourseCatalog({
    ...filters,
    page,
    size: PAGE_SIZE,
    sort,
  });

  const handleFiltersChange = useCallback((newFilters: CourseCatalogFilters) => {
    setFilters(newFilters);
    setPage(0); // Reset to first page when filters change
  }, []);

  const handleSortChange = useCallback((newSort: string) => {
    setSort(newSort);
    setPage(0);
  }, []);

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value - 1); // MUI Pagination is 1-indexed, API is 0-indexed
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
          Khám phá khóa học
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Tìm kiếm và lựa chọn khóa học tiếng Nhật phù hợp với trình độ của bạn
        </Typography>
      </Box>

      {/* Filters */}
      <CourseCatalogFiltersBar
        filters={filters}
        onFiltersChange={handleFiltersChange}
        categories={categoriesData || []}
        categoriesLoading={categoriesLoading}
        sort={sort}
        onSortChange={handleSortChange}
      />

      {/* Results Info */}
      {data && !isLoading && (
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {data.totalElements > 0
              ? `Hiển thị ${data.content.length} / ${data.totalElements} khóa học`
              : ''}
          </Typography>
          {isFetching && !isLoading && (
            <Typography variant="caption" color="text.secondary">
              Đang cập nhật...
            </Typography>
          )}
        </Stack>
      )}

      {/* Content States */}
      {isLoading && <LoadingState message="Đang tải danh sách khóa học..." fullHeight />}

      {isError && (
        <ErrorState
          title="Không thể tải danh sách khóa học"
          message="Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại."
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && data && data.content.length === 0 && (
        <EmptyState
          title="Không tìm thấy khóa học"
          description="Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm để xem thêm kết quả."
          icon={<SearchOffIcon sx={{ fontSize: 64, color: 'text.disabled' }} />}
          actionLabel="Xóa bộ lọc"
          onAction={() => {
            setFilters({});
            setSort('publishedAt,desc');
          }}
        />
      )}

      {/* Course Grid */}
      {!isLoading && !isError && data && data.content.length > 0 && (
        <>
          <Grid container spacing={3}>
            {data.content.map((course) => (
              <Grid
                key={course.id}
                size={{ xs: 12, sm: 6, md: 4, lg: 3 }}
              >
                <CourseCatalogCard course={course} />
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 2 }}>
              <Pagination
                count={data.totalPages}
                page={page + 1} // MUI is 1-indexed
                onChange={handlePageChange}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};
