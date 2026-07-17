import React, { useState } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Drawer,
  IconButton,
  Stack,
  Typography,
  InputAdornment,
  useMediaQuery,
  useTheme,
  Divider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';
import type { CourseCatalogFilters, CourseCategory } from '../types/catalogTypes';

interface CourseCatalogFiltersProps {
  filters: CourseCatalogFilters;
  onFiltersChange: (filters: CourseCatalogFilters) => void;
  categories: CourseCategory[];
  categoriesLoading?: boolean;
}

const JLPT_LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'];

const SORT_OPTIONS = [
  { value: 'publishedAt,desc', label: 'Mới nhất' },
  { value: 'price,asc', label: 'Giá tăng dần' },
  { value: 'price,desc', label: 'Giá giảm dần' },
  { value: 'title,asc', label: 'Tên A-Z' },
];

interface CourseCatalogFiltersWithSortProps extends CourseCatalogFiltersProps {
  sort: string;
  onSortChange: (sort: string) => void;
}

export const CourseCatalogFiltersBar: React.FC<CourseCatalogFiltersWithSortProps> = ({
  filters,
  onFiltersChange,
  categories,
  categoriesLoading,
  sort,
  onSortChange,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleChange = (field: keyof CourseCatalogFilters, value: string | number | undefined) => {
    onFiltersChange({ ...filters, [field]: value || undefined });
  };

  const handleClearAll = () => {
    onFiltersChange({});
    onSortChange('publishedAt,desc');
    setDrawerOpen(false);
  };

  const hasActiveFilters = !!(
    filters.keyword ||
    filters.category ||
    filters.jlptLevel ||
    filters.minPrice ||
    filters.maxPrice
  );

  const filterContent = (
    <Stack spacing={2} sx={{ p: isMobile ? 2 : 0 }}>
      {isMobile && (
        <>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Bộ lọc
            </Typography>
            <IconButton onClick={() => setDrawerOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
          <Divider />
        </>
      )}

      {/* Category */}
      <FormControl size="small" fullWidth={isMobile} sx={{ minWidth: isMobile ? undefined : 160 }}>
        <InputLabel>Danh mục</InputLabel>
        <Select
          value={filters.category || ''}
          label="Danh mục"
          onChange={(e) => handleChange('category', e.target.value)}
        >
          <MenuItem value="">Tất cả</MenuItem>
          {!categoriesLoading &&
            categories.map((cat) => (
              <MenuItem key={cat.id} value={cat.code}>
                {cat.name}
              </MenuItem>
            ))}
        </Select>
      </FormControl>

      {/* JLPT Level */}
      <FormControl size="small" fullWidth={isMobile} sx={{ minWidth: isMobile ? undefined : 120 }}>
        <InputLabel>Trình độ</InputLabel>
        <Select
          value={filters.jlptLevel || ''}
          label="Trình độ"
          onChange={(e) => handleChange('jlptLevel', e.target.value)}
        >
          <MenuItem value="">Tất cả</MenuItem>
          {JLPT_LEVELS.map((level) => (
            <MenuItem key={level} value={level}>
              {level}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Price Range */}
      <Stack direction={isMobile ? 'column' : 'row'} spacing={1}>
        <TextField
          size="small"
          label="Giá từ"
          type="number"
          value={filters.minPrice || ''}
          onChange={(e) =>
            handleChange('minPrice', e.target.value ? Number(e.target.value) : undefined)
          }
          slotProps={{ htmlInput: { min: 0 } }}
          sx={{ minWidth: 120 }}
        />
        <TextField
          size="small"
          label="Giá đến"
          type="number"
          value={filters.maxPrice || ''}
          onChange={(e) =>
            handleChange('maxPrice', e.target.value ? Number(e.target.value) : undefined)
          }
          slotProps={{ htmlInput: { min: 0 } }}
          sx={{ minWidth: 120 }}
        />
      </Stack>

      {/* Sort */}
      <FormControl size="small" fullWidth={isMobile} sx={{ minWidth: isMobile ? undefined : 160 }}>
        <InputLabel>Sắp xếp</InputLabel>
        <Select value={sort} label="Sắp xếp" onChange={(e) => onSortChange(e.target.value)}>
          {SORT_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Clear Filters */}
      {(hasActiveFilters || sort !== 'publishedAt,desc') && (
        <Button size="small" onClick={handleClearAll} color="inherit">
          Xóa bộ lọc
        </Button>
      )}

      {isMobile && (
        <Button
          variant="contained"
          fullWidth
          onClick={() => setDrawerOpen(false)}
          sx={{ mt: 1 }}
        >
          Áp dụng
        </Button>
      )}
    </Stack>
  );

  return (
    <Box sx={{ mb: 3 }}>
      {/* Search Bar — always visible */}
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
        <TextField
          size="small"
          placeholder="Tìm kiếm khóa học..."
          value={filters.keyword || ''}
          onChange={(e) => handleChange('keyword', e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            },
          }}
          sx={{ flexGrow: 1 }}
        />
        {isMobile && (
          <IconButton
            onClick={() => setDrawerOpen(true)}
            color={hasActiveFilters ? 'primary' : 'default'}
            sx={{
              border: 1,
              borderColor: hasActiveFilters ? 'primary.main' : 'divider',
              borderRadius: 1,
            }}
          >
            <FilterListIcon />
          </IconButton>
        )}
      </Stack>

      {/* Desktop: inline filters */}
      {!isMobile && (
        <Stack direction="row" spacing={1.5} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
          {filterContent}
        </Stack>
      )}

      {/* Mobile: drawer filters */}
      <Drawer
        anchor="bottom"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            maxHeight: '80vh',
          },
        }}
      >
        {filterContent}
      </Drawer>
    </Box>
  );
};
