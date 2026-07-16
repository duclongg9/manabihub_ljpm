import React, { useState, useEffect, useCallback } from 'react';
import { Box, Container, Typography, Button } from '@mui/material';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../shared/constants/routes';
import { getAsset } from '../../../shared/utils/assets';

const SLIDER_DATA = [
  {
    teacherImg: getAsset('teacher1.png'),
    courseBg: getAsset('course1.png'),
    teacherName: 'Giảng viên 1'
  },
  {
    teacherImg: getAsset('teacher2.png'),
    courseBg: getAsset('course2.png'),
    teacherName: 'Giảng viên 2'
  },
  {
    teacherImg: getAsset('teacher3.png'),
    courseBg: getAsset('course3.png'),
    teacherName: 'Giảng viên 3'
  },
];

export const HeroSection: React.FC = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % SLIDER_DATA.length);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      handleNext();
    }, 5000);
    return () => clearInterval(interval);
  }, [handleNext]);

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: { xs: '80vh', md: '90vh' },
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        bgcolor: '#000000',
      }}
    >
      {/* Dynamic Backgrounds with Crossfade */}
      {SLIDER_DATA.map((data, index) => (
        <Box
          key={`bg-${index}`}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: `url(${data.courseBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: currentIndex === index ? 1 : 0,
            transform: currentIndex === index ? 'scale(1)' : 'scale(1.05)',
            transition: 'opacity 1.5s ease-in-out, transform 1.5s ease-in-out',
            zIndex: 0
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
          bgcolor: 'rgba(0, 0, 0, 0.75)',
          zIndex: 1
        }}
      />

      {/* Content overlayed on top */}
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column-reverse', md: 'row' },
            alignItems: 'center',
            gap: { xs: 6, md: 4 }
          }}
        >
          {/* Left Content (Text + Buttons) - 55% to give right more space */}
          <Box sx={{ width: { xs: '100%', md: '55%' } }}>
            <Box
              key={currentIndex}
              sx={{
                animation: 'flowOut 1.5s cubic-bezier(0.22, 1, 0.36, 1) forwards',
                '@keyframes flowOut': {
                  '0%': {
                    opacity: 0,
                    transform: 'translateX(-100px)',
                    filter: 'blur(8px)'
                  },
                  '100%': {
                    opacity: 1,
                    transform: 'translateX(0)',
                    filter: 'blur(0)'
                  }
                }
              }}
            >
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
                  fontSize: { xs: '1.05rem', md: '1.2rem' },
                  pr: { md: 4 }
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
          </Box>

          {/* Right Content (Teacher Images Slider in a Circle) - 45% */}
          <Box
            sx={{
              width: { xs: '100%', md: '45%' },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: { xs: 'center', md: 'flex-end' },
              position: 'relative'
            }}
          >
            {/* Circular Image Container */}
            <Box
              sx={{
                width: '100%',
                maxWidth: { xs: '450px', md: '560px' },
                aspectRatio: '1/1',
                borderRadius: '50%',
                overflow: 'hidden',
                position: 'relative',
                boxShadow: '0 15px 40px rgba(0, 0, 0, 0.3)',
                border: { xs: '12px solid #ffffff', md: '18px solid #ffffff' },
                bgcolor: '#e2e8f0', // In case of transparent images
                zIndex: 1,
                mb: 4, // Margin bottom to make space for buttons
                transition: 'transform 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.02)'
                }
              }}
            >
              {SLIDER_DATA.map((data, index) => (
                <Box
                  key={`teacher-${index}`}
                  component="img"
                  src={data.teacherImg}
                  alt={data.teacherName}
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: currentIndex === index ? 1 : 0,
                    transform: currentIndex === index ? 'scale(1)' : 'scale(1.15)',
                    transition: 'opacity 1.5s ease-in-out, transform 1.5s ease-in-out',
                  }}
                />
              ))}
            </Box>

            {/* Slider Navigation Buttons */}
            <Box sx={{ display: 'flex', gap: 2, zIndex: 2, justifyContent: 'center', width: { xs: '100%', md: 'auto' }, mr: { md: '180px' } }}>
              {/* Pagination Dots */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1, borderRadius: '20px', background: 'rgba(0, 0, 0, 0.2)', backdropFilter: 'blur(5px)' }}>
                {SLIDER_DATA.map((_, index) => (
                  <Box
                    key={`dot-${index}`}
                    onClick={() => setCurrentIndex(index)}
                    sx={{
                      width: currentIndex === index ? 32 : 10,
                      height: 10,
                      borderRadius: 5,
                      bgcolor: currentIndex === index ? '#60a5fa' : 'rgba(255, 255, 255, 0.4)',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        bgcolor: currentIndex === index ? '#60a5fa' : 'rgba(255, 255, 255, 0.8)',
                      }
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};
