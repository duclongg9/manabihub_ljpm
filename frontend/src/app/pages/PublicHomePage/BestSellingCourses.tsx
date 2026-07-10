import React, { useState, useEffect, useRef } from 'react';
import { Box, Container, Typography, Card, CardMedia, CardContent, Rating, Stack, Button, IconButton, Avatar } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArticleIcon from '@mui/icons-material/Article';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { ROUTES } from '../../../shared/constants/routes';
import { getAsset } from '../../../shared/utils/assets';

// 10 Mock Courses
const COURSES = [
  { id: '1', title: 'Combo JLPT N3 Toàn Diện - Đỗ ngay lần đầu tiên', instructor: 'Sensei Akira', rating: 4.8, reviews: 1234, currentPrice: '699.000đ', originalPrice: '1.200.000đ', thumbnail: getAsset('course1.png') },
  { id: '2', title: 'Khóa học N4 Cấp tốc trong 3 tháng', instructor: 'Rina Sensei', rating: 4.9, reviews: 834, currentPrice: '499.000đ', originalPrice: '690.000đ', thumbnail: getAsset('course2.png') },
  { id: '3', title: 'Giao tiếp Tiếng Nhật trong Công sở (Business)', instructor: 'Tanaka Hiroshi', rating: 4.7, reviews: 532, currentPrice: '899.000đ', originalPrice: '1.500.000đ', thumbnail: getAsset('course3.png') },
  { id: '4', title: 'Luyện nghe hiểu Choukai N2 Chuyên sâu', instructor: 'Sensei Akira', rating: 4.8, reviews: 328, currentPrice: '550.000đ', originalPrice: '800.000đ', thumbnail: getAsset('course4.png') },
  { id: '5', title: 'Ngữ pháp N1: Luyện tư duy tiếng Nhật chuẩn', instructor: 'Yukiko Sensei', rating: 4.9, reviews: 215, currentPrice: '750.000đ', originalPrice: '1.100.000đ', thumbnail: getAsset('course1.png') },
  { id: '6', title: 'Tiếng Nhật Giao tiếp Dịch vụ (Omotenashi)', instructor: 'Mika Suzuki', rating: 4.8, reviews: 400, currentPrice: '400.000đ', originalPrice: '600.000đ', thumbnail: getAsset('course2.png') },
  { id: '7', title: 'Chinh phục Kanji N5-N3 siêu tốc qua Hình ảnh', instructor: 'Thầy Cường Nhật', rating: 4.7, reviews: 1540, currentPrice: '299.000đ', originalPrice: '500.000đ', thumbnail: getAsset('course3.png') },
  { id: '8', title: 'Luyện thi đỗ EJU - Đại học Nhật Bản', instructor: 'Tanaka Hiroshi', rating: 5.0, reviews: 89, currentPrice: '1.500.000đ', originalPrice: '2.500.000đ', thumbnail: getAsset('course4.png') },
  { id: '9', title: 'Khóa học Tiếng Nhật IT - Dành cho Kỹ sư Cầu nối (BrSE)', instructor: 'Kenji Sato', rating: 4.8, reviews: 760, currentPrice: '990.000đ', originalPrice: '1.800.000đ', thumbnail: getAsset('course1.png') },
  { id: '10', title: 'Khóa Đọc hiểu Dokkai N3 Từ con số 0', instructor: 'Rina Sensei', rating: 4.6, reviews: 432, currentPrice: '450.000đ', originalPrice: '700.000đ', thumbnail: getAsset('course2.png') },
];

export const BestSellingCourses: React.FC = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const itemsToShow = 3; 
  const maxIndex = COURSES.length - itemsToShow;

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
          <Box 
            sx={{ 
              display: 'flex', 
              transition: 'transform 0.5s ease-in-out',
              transform: `translateX(-${currentIndex * (100 / itemsToShow)}%)`,
            }}
          >
            {COURSES.map((course) => (
              <Box 
                key={course.id} 
                sx={{ 
                  minWidth: { xs: '100%', sm: '50%', md: `${100 / itemsToShow}%` }, 
                  px: 2, // Gutter between cards
                  display: 'flex',
                  justifyContent: 'center'
                }}
              >
                {/* 365x519 Exact Size Card */}
                <Card
                  onClick={() => navigate(ROUTES.PUBLIC.COURSE_BROWSE)}
                  sx={{
                    width: '365px',
                    height: '519px',
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
                    height="200"
                    image={course.thumbnail}
                    alt={course.title}
                  />
                  <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 3 }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 700, 
                        color: '#0f172a', 
                        lineHeight: 1.4, 
                        mb: 1.5, 
                        fontSize: '1.15rem',
                        display: '-webkit-box', 
                        WebkitLineClamp: 2, 
                        WebkitBoxOrient: 'vertical', 
                        overflow: 'hidden' 
                      }}
                    >
                      {course.title}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                      <Avatar sx={{ width: 24, height: 24, mr: 1, fontSize: '0.8rem', bgcolor: '#e2e8f0', color: '#0f172a', fontWeight: 600 }}>{course.instructor.charAt(0)}</Avatar>
                      <Typography variant="body2" sx={{ color: '#64748b' }}>
                        {course.instructor}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
                      <Typography variant="subtitle2" sx={{ color: '#d97706', fontWeight: 700 }}>
                        {course.rating}
                      </Typography>
                      <Rating value={course.rating} precision={0.1} size="small" readOnly sx={{ color: '#fbbf24' }} />
                      <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                        ({course.reviews})
                      </Typography>
                    </Box>

                    {/* Push price to bottom */}
                    <Box sx={{ mt: 'auto' }}>
                      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'baseline' }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                          {course.currentPrice}
                        </Typography>
                        {course.originalPrice && (
                          <Typography variant="body2" sx={{ color: '#94a3b8', textDecoration: 'line-through' }}>
                            {course.originalPrice}
                          </Typography>
                        )}
                      </Stack>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        </Box>
      </Container>
    </Box>
  );
};
