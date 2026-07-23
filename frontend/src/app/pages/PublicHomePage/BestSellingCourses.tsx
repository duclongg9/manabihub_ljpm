import React, { useState, useEffect, useRef } from 'react';
import { Box, Container, Typography, Button, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArticleIcon from '@mui/icons-material/Article';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { ROUTES } from '../../../shared/constants/routes';
import { useCourseCatalog } from '../../../features/catalog/hooks/useCourseCatalog';
import { CourseCatalogCard } from '../../../features/catalog/components/CourseCatalogCard';
export const BestSellingCourses: React.FC = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data, isLoading } = useCourseCatalog({ page: 0, size: 10, sort: 'publishedAt,desc' });
  const courses = data?.content || [];

  const itemsToShow = 3;
  const maxIndex = Math.max(0, courses.length - itemsToShow);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.15, rootMargin: '0px' }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Auto-play slider
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 4000);
    return () => clearInterval(timer);
  }, [maxIndex]);

  const handleNext = () => setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  const handlePrev = () => setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));

  return (
    <Box ref={sectionRef} sx={{ py: 10, bgcolor: '#f8fafc', perspective: '1500px' }}>
      <Container maxWidth="xl" sx={{ px: { xs: 3, md: 6 } }}>

        {/* Header Block */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'flex-end' }, mb: 5 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
              <ArticleIcon sx={{ fontSize: 18, color: '#3b82f6', mr: 1 }} />
              <Typography variant="overline" sx={{ color: '#3b82f6', fontWeight: 600, letterSpacing: '0.05em', fontSize: '0.85rem' }}>
                PHỔ BIẾN HÀNG ĐẦU
              </Typography>
            </Box>
            <Typography variant="h3" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
              Các Khóa Học Phổ Biến
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mt: { xs: 3, md: 0 } }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton onClick={handlePrev} sx={{ border: '1px solid #e2e8f0', bgcolor: '#ffffff', '&:hover': { bgcolor: '#f1f5f9' } }}>
                <KeyboardArrowLeftIcon />
              </IconButton>
              <IconButton onClick={handleNext} sx={{ border: '1px solid #e2e8f0', bgcolor: '#ffffff', '&:hover': { bgcolor: '#f1f5f9' } }}>
                <KeyboardArrowRightIcon />
              </IconButton>
            </Box>

            <Button
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate(ROUTES.PUBLIC.COURSE_BROWSE)}
              sx={{
                bgcolor: '#2563eb',
                py: 1.5,
                px: 3,
                fontWeight: 600,
                borderRadius: 1,
                boxShadow: 'none',
                textTransform: 'uppercase',
                '&:hover': {
                  bgcolor: '#1d4ed8',
                  boxShadow: '0 4px 14px rgba(37,99,235,0.4)'
                }
              }}
            >
              XEM TẤT CẢ KHÓA HỌC
            </Button>
          </Box>
        </Box>

        {/* Slider Block */}
        <Box
          sx={{
            width: '100%',
            overflow: 'hidden',
            position: 'relative',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(50px)',
            transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
              <Typography sx={{ color: 'text.secondary' }}>Đang tải danh sách khóa học...</Typography>
            </Box>
          ) : courses.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
              <Typography sx={{ color: 'text.secondary' }}>Chưa có khóa học nào.</Typography>
            </Box>
          ) : (
          <Box
            sx={{
              display: 'flex',
              transition: 'transform 0.5s ease-in-out',
              transform: `translateX(-${currentIndex * (100 / itemsToShow)}%)`,
            }}
          >
            {courses.map((course) => (
              <Box
                key={course.id}
                sx={{
                  minWidth: { xs: '100%', sm: '50%', md: `${100 / itemsToShow}%` },
                  px: 2, // Gutter between cards
                  display: 'flex',
                  justifyContent: 'center'
                }}
              >
                {/* Fixed Size Wrapper */}
                <Box sx={{ width: '365px', height: '480px' }}>
                  <CourseCatalogCard course={course} viewMode="grid" />
                </Box>
              </Box>
            ))}
          </Box>
          )}
        </Box>
      </Container>
    </Box>
  );
};
