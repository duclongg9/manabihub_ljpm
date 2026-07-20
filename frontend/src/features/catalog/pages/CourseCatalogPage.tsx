import React, { useState, useCallback, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Grid, 
  Pagination, 
  Typography, 
  Select, 
  MenuItem, 
  ToggleButtonGroup, 
  ToggleButton, 
  InputBase,
  IconButton,
  Paper,
  Stack
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LayoutGridIcon from '@mui/icons-material/GridView';
import ListIcon from '@mui/icons-material/ViewList';
import { useCourseCatalog } from '../hooks/useCourseCatalog';
import { useCourseCategories } from '../hooks/useCourseCategories';
import { CourseCatalogCard } from '../components/CourseCatalogCard';
import { CourseCatalogFiltersSidebar } from '../components/CourseCatalogFilters';
import { LoadingState } from '../../../shared/components/LoadingState/LoadingState';
import { EmptyState } from '../../../shared/components/EmptyState/EmptyState';
import { ErrorState } from '../../../shared/components/ErrorState/ErrorState';
import type { CourseCatalogFilters } from '../types/catalogTypes';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import type { SelectChangeEvent } from '@mui/material';
import { useSearchParams } from 'react-router-dom';

const PAGE_SIZE = 12;

export const CourseCatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Derive state from URL
  const filters: CourseCatalogFilters = {
    keyword: searchParams.get('keyword') || undefined,
    category: searchParams.get('category') || undefined,
    jlptLevel: searchParams.get('jlptLevel') || undefined,
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    rating: searchParams.get('rating') ? Number(searchParams.get('rating')) : undefined,
  };
  const page = searchParams.get('page') ? Number(searchParams.get('page')) - 1 : 0;
  const sort = searchParams.get('sort') || 'publishedAt,desc';
  const viewMode = (searchParams.get('viewMode') as 'grid' | 'list') || 'grid';
  
  // Local state for search input (debounce-like)
  const [searchInput, setSearchInput] = useState(filters.keyword || '');

  // Keep search input in sync with URL if user navigates back/forward
  useEffect(() => {
    setSearchInput(filters.keyword || '');
  }, [filters.keyword]);

  const updateURL = useCallback((newFilters: CourseCatalogFilters, newPage: number, newSort: string, newViewMode: string) => {
    const params = new URLSearchParams();
    if (newFilters.keyword) params.set('keyword', newFilters.keyword);
    if (newFilters.category) params.set('category', newFilters.category);
    if (newFilters.jlptLevel) params.set('jlptLevel', newFilters.jlptLevel);
    if (newFilters.minPrice) params.set('minPrice', newFilters.minPrice.toString());
    if (newFilters.maxPrice) params.set('maxPrice', newFilters.maxPrice.toString());
    if (newFilters.rating) params.set('rating', newFilters.rating.toString());
    if (newPage > 0) params.set('page', (newPage + 1).toString());
    if (newSort !== 'publishedAt,desc') params.set('sort', newSort);
    if (newViewMode !== 'grid') params.set('viewMode', newViewMode);
    
    setSearchParams(params, { replace: true });
  }, [setSearchParams]);

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
    updateURL(newFilters, 0, sort, viewMode);
  }, [sort, viewMode, updateURL]);

  const handleSortChange = (e: SelectChangeEvent) => {
    updateURL(filters, 0, e.target.value, viewMode);
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    updateURL(filters, value - 1, sort, viewMode);
    window.scrollTo({ top: 350, behavior: 'smooth' });
  };

  const handleClearAll = () => {
    setSearchInput('');
    updateURL({}, 0, 'publishedAt,desc', viewMode);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleFiltersChange({ ...filters, keyword: searchInput || undefined });
  };

  const handleViewModeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newMode: 'grid' | 'list' | null,
  ) => {
    if (newMode !== null) {
      updateURL(filters, page, sort, newMode);
    }
  };

  return (
    <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh', pb: 12 }}>
      <style>
        {`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes heartbeat {
            0% { transform: scale(1); }
            25% { transform: scale(1.2); }
            50% { transform: scale(1); }
            75% { transform: scale(1.2); }
            100% { transform: scale(1.1); }
          }
        `}
      </style>

      {/* Search Hero */}
      <Box 
        sx={{ 
          position: 'relative',
          height: '35vh',
          minHeight: 320,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          bgcolor: 'grey.900'
        }}
      >
        <Box 
          component="img"
          src="https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&q=80&w=2000"
          alt=""
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.3,
          }}
        />
        <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,23,42,1), rgba(15,23,42,0.3))' }} />
        
        <Box sx={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 700, px: 3, textAlign: 'center' }}>
          <Typography variant="h3" component="h1" sx={{ color: 'white', fontWeight: 800, mb: 4, letterSpacing: '-0.02em' }}>
            Khám phá Khóa học
          </Typography>
          
          <Paper 
            component="form" 
            onSubmit={handleSearchSubmit}
            sx={{ 
              p: '4px 8px', 
              display: 'flex', 
              alignItems: 'center', 
              width: '100%',
              borderRadius: 8,
              bgcolor: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
              transition: 'all 0.3s ease',
              '&:focus-within': {
                bgcolor: 'white',
                '& .search-icon': { color: 'primary.main' },
                '& .MuiInputBase-input': { color: 'text.primary' },
              }
            }}
          >
            <IconButton sx={{ p: '12px', color: 'rgba(255, 255, 255, 0.7)' }} aria-label="search" className="search-icon">
              <SearchIcon />
            </IconButton>
            <InputBase
              sx={{ ml: 1, flex: 1, fontSize: '1.1rem', color: 'white', '.MuiInputBase-input': { py: 1.5, '&::placeholder': { color: 'rgba(255,255,255,0.6)', opacity: 1 } } }}
              placeholder="Tìm kiếm khóa học, kỹ năng hoặc mục tiêu..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </Paper>
        </Box>
      </Box>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ mt: { xs: 4, md: 6 } }}>
        <Grid container spacing={4}>
          {/* Sidebar */}
          <Grid size={{ xs: 12, md: 3 }}>
            <CourseCatalogFiltersSidebar 
              filters={filters} 
              onFiltersChange={handleFiltersChange} 
              categories={categoriesData || []} 
              categoriesLoading={categoriesLoading} 
            />
          </Grid>

          {/* Results Area */}
          <Grid size={{ xs: 12, md: 9 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', mb: 4, gap: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '1.1rem' }}>
                {data ? `${data.totalElements} khóa học` : 'Đang tải...'}
                {isFetching && <Typography component="span" variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>(Đang cập nhật...)</Typography>}
              </Typography>
              
              <Stack direction="row" spacing={2}>
                <Select
                  value={sort}
                  onChange={handleSortChange}
                  size="small"
                  sx={{ 
                    bgcolor: 'white', 
                    borderRadius: 2, 
                    minWidth: 160,
                    fontWeight: 600,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    '.MuiOutlinedInput-notchedOutline': { borderColor: 'divider' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.light' }
                  }}
                >
                  <MenuItem value="publishedAt,desc">Mới nhất</MenuItem>
                  <MenuItem value="price,asc">Giá: Thấp đến Cao</MenuItem>
                  <MenuItem value="price,desc">Giá: Cao đến Thấp</MenuItem>
                  <MenuItem value="title,asc">Tên A-Z</MenuItem>
                </Select>

                <ToggleButtonGroup
                  value={viewMode}
                  exclusive
                  onChange={handleViewModeChange}
                  size="small"
                  sx={{ bgcolor: 'white', '.MuiToggleButtonGroup-grouped': { border: '1px solid', borderColor: 'divider' } }}
                >
                  <ToggleButton value="grid" aria-label="grid view">
                    <LayoutGridIcon fontSize="small" />
                  </ToggleButton>
                  <ToggleButton value="list" aria-label="list view">
                    <ListIcon fontSize="small" />
                  </ToggleButton>
                </ToggleButtonGroup>
              </Stack>
            </Box>

            {/* Content States */}
            {isLoading && (
              <Box sx={{ py: 10 }}>
                <LoadingState message="Đang tải danh sách khóa học..." />
              </Box>
            )}
            
            {isError && (
              <Box sx={{ py: 10 }}>
                <ErrorState
                  title="Không thể tải danh sách khóa học"
                  message="Đã xảy ra lỗi khi kết nối. Vui lòng thử lại."
                  onRetry={() => refetch()}
                />
              </Box>
            )}
            
            {!isLoading && !isError && data && data.content.length === 0 && (
              <Box sx={{ py: 8, bgcolor: 'white', borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <EmptyState
                  title="Không tìm thấy kết quả phù hợp"
                  description="Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm để xem thêm kết quả."
                  icon={<SearchOffIcon sx={{ fontSize: 64, color: 'text.secondary' }} />}
                  actionLabel="Xóa bộ lọc"
                  onAction={handleClearAll}
                />
              </Box>
            )}

            {/* Grid */}
            {!isLoading && !isError && data && data.content.length > 0 && (
              <Box 
                sx={{ 
                  transition: 'opacity 0.3s ease',
                  opacity: isFetching ? 0.6 : 1, // Smoothly dim while fetching new filters
                  pointerEvents: isFetching ? 'none' : 'auto'
                }}
              >
                <Grid container spacing={3}>
                  {data.content.map((course, index) => (
                    <Grid size={{ xs: 12, sm: viewMode === 'grid' ? 6 : 12, lg: viewMode === 'grid' ? 4 : 12 }} key={course.id}>
                      <Box sx={{
                        animation: 'fadeInUp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both',
                        animationDelay: `${index * 50}ms`
                      }}>
                        <CourseCatalogCard course={course} viewMode={viewMode} />
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {/* Pagination: Now explicitly shown whenever data exists to prevent it from disappearing if totalPages is 1 */}
            {!isLoading && !isError && data && (
              <Box sx={{ mt: 8, display: 'flex', justifyContent: 'center' }}>
                <Pagination
                  count={data.totalPages || 1}
                  page={page + 1}
                  onChange={handlePageChange}
                  shape="rounded"
                  sx={{
                    '& .MuiPaginationItem-root': {
                      fontWeight: 'bold',
                      color: 'text.secondary'
                    },
                    '& .Mui-selected': {
                      bgcolor: 'transparent',
                      color: 'text.primary',
                      border: '1px solid #cbd5e1'
                    }
                  }}
                />
              </Box>
            )}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};
