import React, { useCallback, useEffect, useMemo } from 'react';
import {
  Box,
  Container,
  Grid,
  Pagination,
  Stack,
  Typography,
} from '@mui/material';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import { useSearchParams } from 'react-router-dom';
import { CourseCatalogCard } from '../components/CourseCatalogCard';
import { CourseCatalogFiltersBar } from '../components/CourseCatalogFilters';
import { useCourseCatalog } from '../hooks/useCourseCatalog';
import { useCourseCategories } from '../hooks/useCourseCategories';
import { EmptyState } from '../../../shared/components/EmptyState/EmptyState';
import { ErrorState } from '../../../shared/components/ErrorState/ErrorState';
import { LoadingState } from '../../../shared/components/LoadingState/LoadingState';
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
    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', bgcolor: '#FBF9F5', pb: 8 }}>
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 }, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ mb: 3 }}>
          <Typography component="h1" variant="h4" sx={{ fontWeight: 800 }}>
            Khóa học tiếng Nhật
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75 }}>
            Tìm khóa học đã xuất bản theo mục tiêu, trình độ và ngân sách của bạn.
          </Typography>
        </Box>

        <CourseCatalogFiltersBar
          filters={query.filters}
          onFiltersChange={handleFiltersChange}
          categories={categories}
          categoriesLoading={categoriesLoading}
          sort={query.sort}
          onSortChange={handleSortChange}
        />

        <Stack
          direction="row"
          sx={{ my: 3, minHeight: 28, justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {data ? `${data.totalElements} khóa học` : 'Danh sách khóa học'}
          </Typography>
          {isFetching && !isLoading && (
            <Typography variant="caption" color="text.secondary">
              Đang cập nhật...
            </Typography>
          )}
        </Stack>

        {isLoading && <LoadingState message="Đang tải danh sách khóa học..." />}

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
              spacing={2.5}
              sx={{ opacity: isFetching ? 0.6 : 1, transition: 'opacity 160ms ease', alignContent: 'flex-start', minHeight: 400 }}
            >
              {data.content.map((course) => (
                <Grid key={course.id} size={{ xs: 12, sm: 6, lg: 4, xl: 3 }}>
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
      </Container>
    </Box>
  );
};
