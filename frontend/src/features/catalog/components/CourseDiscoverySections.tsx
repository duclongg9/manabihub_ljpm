import React from 'react';
import {
  Box,
  Button,
  Chip,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import LocalFireDepartmentRoundedIcon from '@mui/icons-material/LocalFireDepartmentRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded';
import { CourseCatalogCard } from './CourseCatalogCard';
import type { PublicCourseSummary } from '../types/catalogTypes';

interface CourseDiscoverySectionsProps {
  courses: PublicCourseSummary[];
  selectedLevel?: string;
  onLevelChange: (level?: string) => void;
}

const LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'];

function takeDistinct(courses: PublicCourseSummary[], limit: number): PublicCourseSummary[] {
  return courses.filter((course, index, all) => all.findIndex((item) => item.id === course.id) === index).slice(0, limit);
}

function CourseRail({
  title,
  icon,
  subtitle,
  courses,
  onViewAll,
}: {
  title: string;
  icon: React.ReactNode;
  subtitle: string;
  courses: PublicCourseSummary[];
  onViewAll: () => void;
}) {
  if (courses.length === 0) return null;

  return (
    <Box sx={{ mb: { xs: 4, md: 5 } }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Box sx={{ color: '#C41E3A', display: 'inline-flex' }}>{icon}</Box>
            <Typography component="h2" variant="h6" sx={{ fontWeight: 800, color: '#14284B' }}>{title}</Typography>
          </Stack>
          <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5 }}>{subtitle}</Typography>
        </Box>
        <Button
          variant="text"
          endIcon={<ArrowForwardRoundedIcon />}
          onClick={onViewAll}
          sx={{ color: '#C41E3A', fontWeight: 700, textTransform: 'none' }}
        >
          Xem tất cả
        </Button>
      </Stack>
      <Grid container spacing={2.5}>
        {courses.map((course) => (
          <Grid key={course.id} size={{ xs: 12, sm: 6, lg: 3 }}>
            <CourseCatalogCard course={course} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export const CourseDiscoverySections: React.FC<CourseDiscoverySectionsProps> = ({
  courses,
  selectedLevel,
  onLevelChange,
}) => {
  const levelCourses = selectedLevel
    ? courses.filter((course) => course.jlptLevel === selectedLevel)
    : courses;
  const bestSellers = takeDistinct(
    [...levelCourses].filter((course) => (course.enrollmentCount ?? 0) > 0).sort((a, b) => (b.enrollmentCount ?? 0) - (a.enrollmentCount ?? 0)),
    4,
  );
  const featured = bestSellers.length > 0 ? bestSellers : takeDistinct([...levelCourses].sort((a, b) => (new Date(b.publishedAt ?? 0).getTime() - new Date(a.publishedAt ?? 0).getTime())), 4);
  const topRated = takeDistinct(
    [...levelCourses]
      .filter((course) => (course.reviewCount ?? 0) >= 2 && (course.averageRating ?? 0) >= 4.5)
      .sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0) || (b.reviewCount ?? 0) - (a.reviewCount ?? 0)),
    4,
  );

  return (
    <Box>
      <Box
        component="section"
        aria-labelledby="catalog-discovery-levels"
        sx={{ mb: { xs: 4, md: 5 }, p: { xs: 2, md: 3 }, borderRadius: 3, bgcolor: '#FFFDF8', border: '1px solid #E8E0D8', boxShadow: '0 8px 24px rgba(20,40,75,0.05)' }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between' }}>
          <Box>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <SchoolRoundedIcon sx={{ color: '#C41E3A' }} />
              <Typography id="catalog-discovery-levels" component="h2" variant="h6" sx={{ color: '#14284B', fontWeight: 800 }}>
                Chọn lộ trình JLPT
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5 }}>
              Bắt đầu từ cấp độ phù hợp với mục tiêu của bạn.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
            <Chip
              label="Tất cả"
              onClick={() => onLevelChange(undefined)}
              variant={selectedLevel ? 'outlined' : 'filled'}
              sx={{ fontWeight: 700, ...(selectedLevel ? {} : { bgcolor: '#C41E3A', color: '#fff' }) }}
            />
            {LEVELS.map((level) => (
              <Chip
                key={level}
                label={level}
                onClick={() => onLevelChange(level)}
                variant={selectedLevel === level ? 'filled' : 'outlined'}
                sx={{ fontWeight: 700, ...(selectedLevel === level ? { bgcolor: '#C41E3A', color: '#fff' } : {}) }}
              />
            ))}
          </Stack>
        </Stack>
      </Box>

      <CourseRail
        title={bestSellers.length > 0 ? 'Bán chạy nhất' : 'Khóa học nổi bật'}
        icon={<LocalFireDepartmentRoundedIcon />}
        subtitle={bestSellers.length > 0 ? 'Được nhiều học viên đang có quyền truy cập lựa chọn.' : 'Những khóa học mới và phù hợp để bắt đầu.'}
        courses={featured}
        onViewAll={() => onLevelChange(undefined)}
      />
      <CourseRail
        title="Được đánh giá cao"
        icon={<StarRoundedIcon />}
        subtitle="Chỉ hiển thị khi có đủ đánh giá đã được hệ thống duyệt."
        courses={topRated}
        onViewAll={() => onLevelChange(undefined)}
      />
    </Box>
  );
};
