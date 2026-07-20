import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Chip,
  Slider,
  Stack,
  Rating,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import type { CourseCatalogFilters, CourseCategory } from '../types/catalogTypes';

const JLPT_LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'];

interface CourseCatalogFiltersSidebarProps {
  filters: CourseCatalogFilters;
  onFiltersChange: (filters: CourseCatalogFilters) => void;
  categories: CourseCategory[];
  categoriesLoading?: boolean;
}

export const CourseCatalogFiltersSidebar: React.FC<CourseCatalogFiltersSidebarProps> = ({
  filters,
  onFiltersChange,
  categories,
  categoriesLoading,
}) => {
  const [priceRange, setPriceRange] = useState<number[]>([
    filters.minPrice || 0,
    filters.maxPrice || 5000000
  ]);

  useEffect(() => {
    setPriceRange([
      filters.minPrice || 0,
      filters.maxPrice || 5000000
    ]);
  }, [filters.minPrice, filters.maxPrice]);

  const handleChange = (field: keyof CourseCatalogFilters, value: string | number | undefined) => {
    onFiltersChange({ ...filters, [field]: value });
  };

  const handlePriceChange = (_event: Event, newValue: number | number[]) => {
    setPriceRange(newValue as number[]);
  };

  const handlePriceChangeCommitted = (_event: Event | React.SyntheticEvent | Event, newValue: number | number[]) => {
    const [min, max] = newValue as number[];
    onFiltersChange({
      ...filters,
      minPrice: min > 0 ? min : undefined,
      maxPrice: max < 5000000 ? max : undefined,
    });
  };

  const formatPriceLabel = (value: number) => {
    if (value === 5000000) return '5M+';
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
    return value.toString();
  };

  return (
    <Box sx={{ width: '100%', position: { md: 'sticky' }, top: { md: 24 } }}>
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" spacing={1} sx={{ mb: 4, alignItems: 'center' }}>
            <FilterListIcon color="action" />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>Bộ lọc</Typography>
          </Stack>

          {/* Categories */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="overline" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 2 }}>
              Danh mục
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip
                label="Tất cả"
                onClick={() => handleChange('category', undefined)}
                color={!filters.category ? 'primary' : 'default'}
                variant={!filters.category ? 'filled' : 'outlined'}
                sx={{ 
                  fontWeight: 600, 
                  borderRadius: 2,
                  transition: 'all 0.2s',
                  '&:focus-visible': { outline: '2px solid primary.main', outlineOffset: '2px' },
                  ...( !filters.category && { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' } )
                }}
              />
              {!categoriesLoading && categories.map((cat) => (
                <Chip
                  key={cat.id}
                  label={cat.name}
                  onClick={() => handleChange('category', cat.code)}
                  color={filters.category === cat.code ? 'primary' : 'default'}
                  variant={filters.category === cat.code ? 'filled' : 'outlined'}
                  sx={{ 
                    fontWeight: 600, 
                    borderRadius: 2,
                    transition: 'all 0.2s',
                    '&:focus-visible': { outline: '2px solid primary.main', outlineOffset: '2px' },
                    ...( filters.category === cat.code && { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' } )
                  }}
                />
              ))}
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* JLPT Levels */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="overline" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 2 }}>
              Trình độ JLPT
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip
                label="Mọi cấp độ"
                onClick={() => handleChange('jlptLevel', undefined)}
                color={!filters.jlptLevel ? 'primary' : 'default'}
                variant={!filters.jlptLevel ? 'filled' : 'outlined'}
                sx={{ fontWeight: 600, borderRadius: 2 }}
              />
              {JLPT_LEVELS.map((level) => (
                <Chip
                  key={level}
                  label={level}
                  onClick={() => handleChange('jlptLevel', level)}
                  color={filters.jlptLevel === level ? 'primary' : 'default'}
                  variant={filters.jlptLevel === level ? 'filled' : 'outlined'}
                  sx={{ fontWeight: 600, borderRadius: 2 }}
                />
              ))}
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Price Range */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="overline" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 2 }}>
              Khoảng giá
            </Typography>
            <Box sx={{ px: 1 }}>
              <Slider
                value={priceRange}
                onChange={handlePriceChange}
                onChangeCommitted={handlePriceChangeCommitted}
                valueLabelDisplay="auto"
                valueLabelFormat={formatPriceLabel}
                min={0}
                max={5000000}
                step={100000}
                sx={{
                  '& .MuiSlider-thumb': {
                    width: 28, // Slightly larger thumb for better tactile feel
                    height: 28,
                    backgroundColor: '#fff',
                    border: '2px solid currentColor',
                    boxShadow: '0px 2px 6px rgba(0,0,0,0.15)',
                    transition: 'box-shadow 0.2s ease, width 0.2s, height 0.2s',
                    '&:hover, &.Mui-focusVisible': {
                      boxShadow: '0px 0px 0px 8px rgba(15, 23, 42, 0.1)',
                    },
                    '&.Mui-active': {
                      width: 32,
                      height: 32,
                      boxShadow: '0px 0px 0px 12px rgba(15, 23, 42, 0.2)',
                    }
                  },
                  '& .MuiSlider-track': {
                    transition: 'background-color 0.2s ease',
                  }
                }}
              />
              <Stack direction="row" sx={{ mt: 1, justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Miễn phí</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>5.000.000đ+</Typography>
              </Stack>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Rating */}
          <Box>
            <Typography variant="overline" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 2 }}>
              Đánh giá tối thiểu
            </Typography>
            <Stack spacing={1}>
              <Chip
                label="Tất cả đánh giá"
                onClick={() => handleChange('rating', undefined)}
                color={!filters.rating ? 'primary' : 'default'}
                variant={!filters.rating ? 'filled' : 'outlined'}
                sx={{ fontWeight: 600, borderRadius: 2, alignSelf: 'flex-start' }}
              />
              {[4.5, 4.0, 3.5].map((rating) => (
                <Box
                  key={rating}
                  onClick={() => handleChange('rating', rating)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 1,
                    borderRadius: 2,
                    cursor: 'pointer',
                    bgcolor: filters.rating === rating ? 'action.selected' : 'transparent',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <Rating value={rating} readOnly precision={0.5} size="small" />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                    {rating} trở lên
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
