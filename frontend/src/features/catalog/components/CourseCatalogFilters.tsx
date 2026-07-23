import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Divider,
  Drawer,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import type { SelectChangeEvent } from '@mui/material';
import type { CourseCatalogFilters, CourseCategory } from '../types/catalogTypes';

const JLPT_LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'];

interface CourseCatalogFiltersBarProps {
  filters: CourseCatalogFilters;
  onFiltersChange: (filters: CourseCatalogFilters) => void;
  categories: CourseCategory[];
  categoriesLoading?: boolean;
  sort: string;
  onSortChange: (sort: string) => void;
}

function toPriceInput(value?: number): string {
  return value === undefined ? '' : String(value);
}

function parsePrice(value: string): number | undefined {
  if (value.trim() === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

export const CourseCatalogFiltersBar: React.FC<CourseCatalogFiltersBarProps> = ({
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
  const [keyword, setKeyword] = useState(filters.keyword ?? '');
  const [minPrice, setMinPrice] = useState(toPriceInput(filters.minPrice));
  const [maxPrice, setMaxPrice] = useState(toPriceInput(filters.maxPrice));
  const [priceError, setPriceError] = useState('');

  useEffect(() => {
    setKeyword(filters.keyword ?? '');
  }, [filters.keyword]);

  useEffect(() => {
    setMinPrice(toPriceInput(filters.minPrice));
    setMaxPrice(toPriceInput(filters.maxPrice));
  }, [filters.minPrice, filters.maxPrice]);

  const updateFilter = (field: keyof CourseCatalogFilters, value?: string) => {
    onFiltersChange({
      ...filters,
      [field]: value || undefined,
    });
  };

  const submitKeyword = (event: React.FormEvent) => {
    event.preventDefault();
    onFiltersChange({
      ...filters,
      keyword: keyword.trim() || undefined,
    });
  };

  const applyPrice = () => {
    const parsedMin = parsePrice(minPrice);
    const parsedMax = parsePrice(maxPrice);
    const hasInvalidValue =
      (minPrice.trim() !== '' && parsedMin === undefined) ||
      (maxPrice.trim() !== '' && parsedMax === undefined);

    if (hasInvalidValue) {
      setPriceError('Giá phải là số không âm.');
      return;
    }

    if (parsedMin !== undefined && parsedMax !== undefined && parsedMin > parsedMax) {
      setPriceError('Giá tối thiểu không được lớn hơn giá tối đa.');
      return;
    }

    setPriceError('');
    onFiltersChange({
      ...filters,
      minPrice: parsedMin,
      maxPrice: parsedMax,
    });
    setDrawerOpen(false);
  };

  const clearFilters = () => {
    setKeyword('');
    setMinPrice('');
    setMaxPrice('');
    setPriceError('');
    onFiltersChange({});
    setDrawerOpen(false);
  };

  const handleSortChange = (event: SelectChangeEvent) => {
    onSortChange(event.target.value);
  };

  const filterFields = (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, minmax(0, 1fr))',
        gap: 1.5,
        alignItems: 'start',
      }}
    >
      <FormControl fullWidth size="small">
        <InputLabel id="catalog-category-label">Danh mục</InputLabel>
        <Select
          labelId="catalog-category-label"
          value={filters.category ?? ''}
          label="Danh mục"
          disabled={categoriesLoading}
          onChange={(event) => updateFilter('category', event.target.value)}
        >
          <MenuItem value="">Tất cả danh mục</MenuItem>
          {categories.map((category) => (
            <MenuItem key={category.id} value={category.code}>
              {category.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth size="small">
        <InputLabel id="catalog-jlpt-label">Trình độ</InputLabel>
        <Select
          labelId="catalog-jlpt-label"
          value={filters.jlptLevel ?? ''}
          label="Trình độ"
          onChange={(event) => updateFilter('jlptLevel', event.target.value)}
        >
          <MenuItem value="">Mọi cấp độ</MenuItem>
          {JLPT_LEVELS.map((level) => (
            <MenuItem key={level} value={level}>
              JLPT {level}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        sx={{ gridColumn: isMobile ? 'auto' : 'span 2' }}
      >
        <TextField
          label="Giá từ"
          type="number"
          value={minPrice}
          onChange={(event) => setMinPrice(event.target.value)}
          size="small"
          fullWidth
          slotProps={{ htmlInput: { min: 0, step: 10000 } }}
        />
        <TextField
          label="Giá đến"
          type="number"
          value={maxPrice}
          onChange={(event) => setMaxPrice(event.target.value)}
          size="small"
          fullWidth
          slotProps={{ htmlInput: { min: 0, step: 10000 } }}
        />
      </Stack>
      {priceError && (
        <Typography variant="caption" color="error">
          {priceError}
        </Typography>
      )}

      <Button variant="outlined" onClick={applyPrice}>
        Áp dụng khoảng giá
      </Button>

      <FormControl fullWidth size="small">
        <InputLabel id="catalog-sort-label">Sắp xếp</InputLabel>
        <Select
          labelId="catalog-sort-label"
          value={sort}
          label="Sắp xếp"
          onChange={handleSortChange}
        >
          <MenuItem value="publishedAt,desc">Mới xuất bản</MenuItem>
          <MenuItem value="price,asc">Giá thấp đến cao</MenuItem>
          <MenuItem value="price,desc">Giá cao đến thấp</MenuItem>
          <MenuItem value="title,asc">Tên A-Z</MenuItem>
        </Select>
      </FormControl>

      <Button color="inherit" onClick={clearFilters}>
        Xóa bộ lọc
      </Button>
    </Box>
  );

  return (
    <Box>
      <Stack
        component="form"
        onSubmit={submitKeyword}
        direction="row"
        spacing={1}
        sx={{ mb: 2 }}
      >
        <TextField
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="Tìm theo tên khóa học..."
          size="small"
          fullWidth
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
        <Button
          type="submit"
          variant="contained"
          sx={{ minWidth: 112, whiteSpace: 'nowrap' }}
        >
          Tìm kiếm
        </Button>
        {isMobile && (
          <IconButton
            aria-label="Mở bộ lọc"
            title="Bộ lọc"
            onClick={() => setDrawerOpen(true)}
            sx={{ border: '1px solid', borderColor: 'divider' }}
          >
            <FilterListIcon />
          </IconButton>
        )}
      </Stack>

      {!isMobile && (
        <Box
          sx={{
            p: 2,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          {filterFields}
        </Box>
      )}

      <Drawer
        anchor="bottom"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        slotProps={{ paper: { sx: { maxHeight: '88vh', borderRadius: '8px 8px 0 0' } } }}
      >
        <Box sx={{ p: 2.5 }}>
          <Stack
            direction="row"
            sx={{ alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Typography variant="h6">Bộ lọc khóa học</Typography>
            <IconButton
              aria-label="Đóng bộ lọc"
              title="Đóng"
              onClick={() => setDrawerOpen(false)}
            >
              <CloseIcon />
            </IconButton>
          </Stack>
          <Divider sx={{ my: 2 }} />
          {filterFields}
        </Box>
      </Drawer>
    </Box>
  );
};
