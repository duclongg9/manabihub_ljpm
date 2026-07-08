import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Button } from '@mui/material';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../shared/constants/routes';
import { getAsset } from '../../../shared/utils/assets';

const SLIDER_IMAGES = [
  getAsset('course1.png'),
  getAsset('course2.png'),
  getAsset('course3.png'),
];

export const HeroSection: React.FC = () => {
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % SLIDER_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box 
      sx={{ 
        position: 'relative', 
        minHeight: { xs: '80vh', md: '90vh' },
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        bgcolor: '#000000'
      }}
    >
      {/* Background Image Slider */}
      {SLIDER_IMAGES.map((src, index) => (
        <Box 
          key={index}
          component="img"
          src={src}
          alt={`ManabiHub highlight ${index + 1}`}
          sx={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%', 
            height: '100%',
            objectFit: 'cover',
            zIndex: 0,
            opacity: currentImageIndex === index ? 1 : 0,
            transform: currentImageIndex === index ? 'scale(1)' : 'scale(1.05)',
            transition: 'opacity 1.5s ease-in-out, transform 1.5s ease-in-out',
          }}
        />
      ))}

      {/* Dark Overlay for Text Readability */}
      <Box 
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          bgcolor: 'rgba(0, 0, 0, 0.6)',
          zIndex: 1
        }}
      />

      {/* Content overlayed on top */}
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
        <Box sx={{ maxWidth: { xs: '100%', md: '650px' } }}>
          <Typography 
            variant="h1" 
            sx={{ 
              fontWeight: 800, 
              color: '#ffffff', 
              lineHeight: 1.2, 
              mb: 3, 
              fontSize: { xs: '2.5rem', md: '4rem' }, 
              letterSpacing: '-1px' 
            }}
          >
            Học tiếng Nhật <br />
            <Box component="span" sx={{ color: '#60a5fa' }}>Dễ dàng & Hiệu quả</Box>
          </Typography>
          
          <Typography 
            variant="h6" 
            sx={{ 
              color: '#e2e8f0', 
              fontWeight: 400, 
              lineHeight: 1.6, 
              mb: 5, 
              fontSize: { xs: '1.05rem', md: '1.2rem' } 
            }}
          >
            Nền tảng học tiếng Nhật trực tuyến hàng đầu. Kết nối bạn với những giảng viên xuất sắc nhất. Học mọi lúc, mọi nơi với giáo trình chuẩn JLPT, hỗ trợ tận tình và cam kết chất lượng đầu ra.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button 
              variant="contained" 
              size="large"
              onClick={() => navigate(ROUTES.PUBLIC.COURSE_BROWSE)}
              endIcon={<AutoStoriesIcon />}
              sx={{ 
                py: 1.8, 
                px: 5, 
                borderRadius: 3, 
                bgcolor: '#2563eb', 
                color: '#ffffff',
                fontWeight: 700, 
                textTransform: 'none', 
                fontSize: '1.1rem', 
                boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)',
                transition: 'all 0.3s ease',
                '&:hover': { 
                  bgcolor: '#1d4ed8',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 20px 25px -5px rgba(37, 99, 235, 0.4)'
                } 
              }}
            >
              Khám phá khóa học
            </Button>

            <Button 
              variant="outlined" 
              size="large"
              onClick={() => navigate(ROUTES.TEACHER.KYC)}
              sx={{ 
                py: 1.8, 
                px: 5, 
                borderRadius: 3, 
                borderColor: 'rgba(255,255,255,0.5)', 
                color: '#ffffff',
                fontWeight: 700, 
                textTransform: 'none', 
                fontSize: '1.1rem', 
                transition: 'all 0.3s ease',
                '&:hover': { 
                  borderColor: '#ffffff',
                  bgcolor: 'rgba(255,255,255,0.1)',
                  transform: 'translateY(-2px)'
                } 
              }}
            >
              Trở thành giảng viên
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};
