import React, { useState, useEffect, useRef } from 'react';
import { Box, Container, Typography, Grid, Card, CardMedia, CardContent, Rating, Stack } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../shared/constants/routes';
import { getAsset } from '../../../shared/utils/assets';

// Mock data based on Figma
const COURSES = [
  {
    id: '1',
    title: 'Combo JLPT N3 Toàn Diện - Đỗ ngay lần đầu tiên',
    instructor: 'Sensei Akira',
    rating: 4.8,
    reviews: 1234,
    currentPrice: '699.000đ',
    originalPrice: '1.200.000đ',
    thumbnail: getAsset('course1.png')
  },
  {
    id: '2',
    title: 'Khóa học N4 Cấp tốc trong 3 tháng',
    instructor: 'Rina Sensei',
    rating: 4.9,
    reviews: 834,
    currentPrice: '499.000đ',
    originalPrice: '690.000đ',
    thumbnail: getAsset('course2.png')
  },
  {
    id: '3',
    title: 'Giao tiếp Tiếng Nhật trong Công sở (Business)',
    instructor: 'Tanaka Hiroshi',
    rating: 4.7,
    reviews: 532,
    currentPrice: '899.000đ',
    originalPrice: '1.500.000đ',
    thumbnail: getAsset('course3.png')
  },
  {
    id: '4',
    title: 'Luyện nghe hiểu Choukai N2 Chuyên sâu',
    instructor: 'Sensei Akira',
    rating: 4.8,
    reviews: 328,
    currentPrice: '550.000đ',
    originalPrice: '800.000đ',
    thumbnail: getAsset('course4.png')
  }
];

export const BestSellingCourses: React.FC = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

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

  return (
    <Box ref={sectionRef} sx={{ py: 10, bgcolor: '#f8fafc', perspective: '1500px' }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 5 }}>
          <Typography variant="h3" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
            Học viên mua nhiều nhất
          </Typography>
          <Typography 
            component={Link} 
            to={ROUTES.PUBLIC.COURSE_BROWSE}
            sx={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            Xem tất cả &gt;
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {COURSES.map((course, index) => (
            <Grid 
              size={{ xs: 12, sm: 6, md: 3 }} 
              key={course.id}
              sx={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible 
                  ? 'translateZ(0) translateY(0) rotateX(0deg) scale(1)' 
                  : 'translateZ(-200px) translateY(100px) rotateX(15deg) scale(0.9)',
                transition: `all 1.2s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.15}s`,
                transformStyle: 'preserve-3d'
              }}
            >
              <Card 
                onClick={() => navigate(ROUTES.PUBLIC.COURSE_BROWSE)}
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  cursor: 'pointer',
                  borderRadius: 3,
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                  }
                }}
              >
                <CardMedia
                  component="img"
                  height="160"
                  image={course.thumbnail}
                  alt={course.title}
                />
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2.5 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.4, mb: 1, flexGrow: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {course.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', mb: 1.5 }}>
                    {course.instructor}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                    <Typography variant="subtitle2" sx={{ color: '#d97706', fontWeight: 700 }}>
                      {course.rating}
                    </Typography>
                    <Rating value={course.rating} precision={0.1} size="small" readOnly sx={{ color: '#fbbf24' }} />
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                      ({course.reviews})
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'baseline' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                      {course.currentPrice}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8', textDecoration: 'line-through' }}>
                      {course.originalPrice}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};
