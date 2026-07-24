import React, { useCallback, useEffect, useMemo } from 'react';
import {
  Box,
  Grid,
  Pagination,
  Stack,
  Typography,
  Chip,
} from '@mui/material';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../../shared/components/PageHeader/PageHeader';
import { CourseCatalogCard } from '../components/CourseCatalogCard';
import { CourseCatalogFiltersBar } from '../components/CourseCatalogFilters';
import { useCourseCatalog } from '../hooks/useCourseCatalog';
import { useCourseCategories } from '../hooks/useCourseCategories';
import { EmptyState } from '../../../shared/components/EmptyState/EmptyState';
import { ErrorState } from '../../../shared/components/ErrorState/ErrorState';
import type { CourseCatalogFilters } from '../types/catalogTypes';

const PAGE_SIZE = 12;
const DEFAULT_SORT = 'publishedAt,desc';
const ALLOWED_SORTS = new Set([
  DEFAULT_SORT,
  'price,asc',
  'price,desc',
  'title,asc',
]);
const ALLOWED_JLPT_LEVELS = new Set(['N1', 'N2', 'N3', 'N4', 'N5']);

interface CatalogQuery {
  filters: CourseCatalogFilters;
  page: number;
  sort: string;
}

function cleanText(value: string | null): string | undefined {
  const cleaned = value?.trim();
  return cleaned || undefined;
}

function parseNonNegativeNumber(value: string | null): number | undefined {
  if (value === null || value.trim() === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function readCatalogQuery(params: URLSearchParams): CatalogQuery {
  const keyword = cleanText(params.get('keyword'));
  const category = cleanText(params.get('category'));
  const requestedJlpt = cleanText(params.get('jlptLevel'))?.toUpperCase();
  const jlptLevel =
    requestedJlpt && ALLOWED_JLPT_LEVELS.has(requestedJlpt) ? requestedJlpt : undefined;
  const minPrice = parseNonNegativeNumber(params.get('minPrice'));
  const requestedMaxPrice = parseNonNegativeNumber(params.get('maxPrice'));
  const maxPrice =
    requestedMaxPrice !== undefined &&
    (minPrice === undefined || requestedMaxPrice >= minPrice)
      ? requestedMaxPrice
      : undefined;

  const requestedPage = Number(params.get('page'));
  const page =
    Number.isInteger(requestedPage) && requestedPage >= 1 ? requestedPage - 1 : 0;
  const requestedSort = params.get('sort');
  const sort = requestedSort && ALLOWED_SORTS.has(requestedSort) ? requestedSort : DEFAULT_SORT;

  return {
    filters: {
      keyword,
      category,
      jlptLevel,
      minPrice,
      maxPrice,
    },
    page,
    sort,
  };
}

function buildCatalogParams(query: CatalogQuery): URLSearchParams {
  const params = new URLSearchParams();
  const { filters, page, sort } = query;

  if (filters.keyword) params.set('keyword', filters.keyword);
  if (filters.category) params.set('category', filters.category);
  if (filters.jlptLevel) params.set('jlptLevel', filters.jlptLevel);
  if (filters.minPrice !== undefined) params.set('minPrice', String(filters.minPrice));
  if (filters.maxPrice !== undefined) params.set('maxPrice', String(filters.maxPrice));
  if (page > 0) params.set('page', String(page + 1));
  if (sort !== DEFAULT_SORT) params.set('sort', sort);

  return params;
}

export const CourseCatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawQueryString = searchParams.toString();
  const query = useMemo(
    () => readCatalogQuery(new URLSearchParams(rawQueryString)),
    [rawQueryString],
  );

  const replaceQuery = useCallback(
    (nextQuery: CatalogQuery) => {
      setSearchParams(buildCatalogParams(nextQuery), { replace: true });
    },
    [setSearchParams],
  );

  useEffect(() => {
    const canonicalQueryString = buildCatalogParams(query).toString();
    if (canonicalQueryString !== rawQueryString) {
      setSearchParams(new URLSearchParams(canonicalQueryString), { replace: true });
    }
  }, [query, rawQueryString, setSearchParams]);

  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    isSuccess: categoriesLoaded,
  } = useCourseCategories();
  const categories = categoriesData ?? [];
  const {
    data,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useCourseCatalog({
    ...query.filters,
    page: query.page,
    size: PAGE_SIZE,
    sort: query.sort,
  });

  useEffect(() => {
    if (data && data.totalPages > 0 && query.page >= data.totalPages) {
      replaceQuery({ ...query, page: data.totalPages - 1 });
    }
  }, [data, query, replaceQuery]);

  useEffect(() => {
    const selectedCategory = query.filters.category;
    if (
      categoriesLoaded &&
      selectedCategory &&
      !categoriesData?.some((category) => category.code === selectedCategory)
    ) {
      replaceQuery({
        ...query,
        filters: { ...query.filters, category: undefined },
        page: 0,
      });
    }
  }, [categoriesData, categoriesLoaded, query, replaceQuery]);

  const handleFiltersChange = useCallback(
    (filters: CourseCatalogFilters) => {
      replaceQuery({ filters, page: 0, sort: query.sort });
    },
    [query.sort, replaceQuery],
  );

  const handleSortChange = useCallback(
    (sort: string) => {
      replaceQuery({ filters: query.filters, page: 0, sort });
    },
    [query.filters, replaceQuery],
  );

  const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    replaceQuery({ ...query, page: page - 1 });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Box component="main" sx={{ minHeight: '100vh', flexGrow: 1, display: 'flex', flexDirection: 'column', bgcolor: '#FAF9F6', py: { xs: 3, md: 5 }, px: { xs: 2, sm: 3 } }}>
      <Box sx={{ maxWidth: '1280px', mx: 'auto', width: '100%', position: 'relative', flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: '50vh' }}>
        {/* Background Watermark */}
        <Typography variant="h1" sx={{ position: 'absolute', top: -40, right: -20, fontSize: '15rem', fontWeight: 900, color: 'rgba(0,0,0,0.025)', userSelect: 'none', pointerEvents: 'none', zIndex: 0, writingMode: 'vertical-rl' }}>
          探求
        </Typography>
        <PageHeader
          title="Khám phá khóa học"
          subtitle="コースを探す"
          watermark="探求"
          breadcrumbs={[{ label: 'Học viên' }, { label: 'Khám phá khóa học' }]}
        />

        <Box sx={{ position: 'sticky', top: { xs: 56, sm: 64 }, zIndex: 20, bgcolor: 'rgba(250, 249, 246, 0.92)', backdropFilter: 'blur(12px)', py: 2, mx: -2, px: 2, borderRadius: 2, transition: 'all 0.3s' }}>
          <CourseCatalogFiltersBar
            filters={query.filters}
            onFiltersChange={handleFiltersChange}
            categories={categories}
            categoriesLoading={categoriesLoading}
            sort={query.sort}
            onSortChange={handleSortChange}
          />
        </Box>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          sx={{ my: 3, minHeight: 28, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {data ? `${data.totalElements} khóa học` : 'Danh sách khóa học'}
            </Typography>
            {/* Active Filter Badges */}
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
              {query.filters.category && (
                <Chip size="small" label={`Danh mục: ${categories.find(c => c.code === query.filters.category)?.name || query.filters.category}`} onDelete={() => handleFiltersChange({ ...query.filters, category: undefined })} sx={{ bgcolor: '#fee2e2', color: '#C41E3A', fontWeight: 700, '& .MuiChip-deleteIcon': { color: '#C41E3A', '&:hover': { color: '#9f1239' } } }} />
              )}
              {query.filters.jlptLevel && (
                <Chip size="small" label={`Trình độ: ${query.filters.jlptLevel}`} onDelete={() => handleFiltersChange({ ...query.filters, jlptLevel: undefined })} sx={{ bgcolor: '#fee2e2', color: '#C41E3A', fontWeight: 700, '& .MuiChip-deleteIcon': { color: '#C41E3A', '&:hover': { color: '#9f1239' } } }} />
              )}
              {query.filters.minPrice !== undefined && (
                <Chip size="small" label={`Giá từ: ${query.filters.minPrice.toLocaleString()}đ`} onDelete={() => handleFiltersChange({ ...query.filters, minPrice: undefined })} sx={{ bgcolor: '#fee2e2', color: '#C41E3A', fontWeight: 700, '& .MuiChip-deleteIcon': { color: '#C41E3A', '&:hover': { color: '#9f1239' } } }} />
              )}
              {query.filters.maxPrice !== undefined && (
                <Chip size="small" label={`Giá đến: ${query.filters.maxPrice.toLocaleString()}đ`} onDelete={() => handleFiltersChange({ ...query.filters, maxPrice: undefined })} sx={{ bgcolor: '#fee2e2', color: '#C41E3A', fontWeight: 700, '& .MuiChip-deleteIcon': { color: '#C41E3A', '&:hover': { color: '#9f1239' } } }} />
              )}
            </Stack>
          </Box>
          {isFetching && !isLoading && (
            <Typography variant="caption" color="text.secondary">
              Đang cập nhật...
            </Typography>
          )}
        </Stack>

        {isLoading && (
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {Array.from(new Array(12)).map((_, index) => (
              <Grid key={index} size={{ xs: 12, md: 6, lg: 4 }}>
                <Box sx={{ bgcolor: 'white', borderRadius: 4, overflow: 'hidden', border: '1px solid', borderColor: 'grey.100', height: 340 }}>
                  <Box sx={{ width: '100%', aspectRatio: '16/9', bgcolor: 'grey.200', animation: 'pulse 1.5s infinite ease-in-out' }} />
                  <Box sx={{ p: 2 }}>
                    <Box sx={{ width: '30%', height: 16, bgcolor: 'grey.200', borderRadius: 1, mb: 1.5, animation: 'pulse 1.5s infinite ease-in-out' }} />
                    <Box sx={{ width: '90%', height: 24, bgcolor: 'grey.200', borderRadius: 1, mb: 1, animation: 'pulse 1.5s infinite ease-in-out' }} />
                    <Box sx={{ width: '60%', height: 24, bgcolor: 'grey.200', borderRadius: 1, mb: 3, animation: 'pulse 1.5s infinite ease-in-out' }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 'auto' }}>
                      <Box sx={{ width: '40%', height: 24, bgcolor: 'grey.200', borderRadius: 1, animation: 'pulse 1.5s infinite ease-in-out' }} />
                      <Box sx={{ width: '20%', height: 24, bgcolor: 'grey.200', borderRadius: 1, animation: 'pulse 1.5s infinite ease-in-out' }} />
                    </Box>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        )}

        {isError && (
          <ErrorState
            title="Không thể tải danh sách khóa học"
            message="Vui lòng kiểm tra kết nối và thử lại."
            onRetry={() => refetch()}
          />
        )}

        {!isLoading && !isError && data?.content.length === 0 && (
          <Box sx={{ py: 6, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
            <EmptyState
              title="Không tìm thấy khóa học phù hợp"
              description="Hãy thử từ khóa hoặc khoảng giá khác."
              icon={<SearchOffIcon sx={{ fontSize: 56, color: 'text.secondary' }} />}
              actionLabel="Xóa bộ lọc"
              onAction={() => {
                replaceQuery({ filters: {}, page: 0, sort: DEFAULT_SORT });
              }}
            />
          </Box>
        )}

        {!isLoading && !isError && data && data.content.length > 0 && (
          <Box sx={{ flexGrow: 1 }}>
            <Grid
              container
              spacing={3}
              sx={{ opacity: isFetching ? 0.6 : 1, transition: 'opacity 160ms ease', alignContent: 'flex-start' }}
            >
              {data.content.map((course) => (
                <Grid key={course.id} size={{ xs: 12, md: 6, lg: 4 }}>
                  <CourseCatalogCard course={course} />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {!isLoading && !isError && data && data.totalPages > 1 && (
          <Box sx={{ mt: 5, display: 'flex', justifyContent: 'center' }}>
            <Pagination
              count={data.totalPages}
              page={query.page + 1}
              onChange={handlePageChange}
              color="primary"
              shape="rounded"
            />
          </Box>
        )}
      </Box>
    </Box>
  );
};
