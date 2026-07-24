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

// Japanese wave pattern as inline SVG data URI for subtle background texture
const WAVE_PATTERN = `url("data:image/svg+xml,%3Csvg width='100' height='20' viewBox='0 0 100 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M21.184 20c.357-.13.72-.264 1.088-.402l1.768-.661C33.64 15.347 39.647 14 50 14c10.271 0 15.362 1.222 24.629 4.928.955.383 1.869.74 2.75 1.072h6.225c-2.51-.73-5.139-1.691-8.233-2.928C65.888 13.278 60.562 12 50 12c-10.626 0-16.855 1.397-26.66 5.063l-1.767.662c-2.475.923-4.66 1.674-6.724 2.275h6.335zm0-20C13.258 2.892 8.077 4 0 4V2c5.744 0 9.951-.574 14.85-2h6.334zM77.38 0C85.239 2.966 90.502 4 100 4V2c-6.842 0-11.386-.542-16.396-2h-6.225zM0 14c10.271 0 15.362 1.222 24.629 4.928.955.383 1.869.74 2.75 1.072H21.18c-.358-.13-.72-.264-1.088-.402l-1.768-.661C9.73 15.347 3.723 14 0 14v0z' fill='%23ffffff' fill-opacity='0.03' fill-rule='evenodd'/%3E%3C/svg%3E")`;

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
        minHeight: { xs: '85vh', md: '92vh' },
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #1B2A4A 0%, #0F1D36 60%, #0A1628 100%)',
      }}
    >
      {/* Japanese wave pattern overlay */}
      <Box
        sx={{
          position: 'absolute',
          top: 0, left: 0,
          width: '100%', height: '100%',
          backgroundImage: WAVE_PATTERN,
          backgroundRepeat: 'repeat',
          zIndex: 0,
        }}
      />

      {/* Ambient glow effects */}
      <Box
        sx={{
          position: 'absolute',
          top: '-20%', right: '-5%',
          width: '50%', height: '80%',
          background: 'radial-gradient(circle, rgba(196, 30, 58, 0.08) 0%, rgba(0,0,0,0) 70%)',
          zIndex: 0,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '-15%', left: '10%',
          width: '40%', height: '60%',
          background: 'radial-gradient(circle, rgba(91, 140, 90, 0.06) 0%, rgba(0,0,0,0) 70%)',
          zIndex: 0,
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
          {/* Left Content (Text + Buttons) - 55% */}
          <Box sx={{ width: { xs: '100%', md: '55%' } }}>
            <Box
              key={currentIndex}
              sx={{
                animation: 'flowOut 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards',
                '@keyframes flowOut': {
                  '0%': {
                    opacity: 0,
                    transform: 'translateY(30px)',
                    filter: 'blur(6px)'
                  },
                  '100%': {
                    opacity: 1,
                    transform: 'translateY(0)',
                    filter: 'blur(0)'
                  }
                }
              }}
            >
              {/* Japanese text accent */}
              <Typography
                sx={{
                  color: 'rgba(196, 30, 58, 0.7)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  mb: 2,
                }}
              >
                学ぶ — Manabi — Học tập
              </Typography>

              <Typography
                variant="h1"
                sx={{
                  fontWeight: 800,
                  color: '#ffffff',
                  lineHeight: 1.15,
                  mb: 3,
                  fontSize: { xs: '2.5rem', md: '3.8rem' },
                  letterSpacing: '-1px'
                }}
              >
                {'Hành trình chinh phục'} <br />
                <Box
                  component="span"
                  sx={{
                    background: 'linear-gradient(135deg, #C41E3A, #E8432A)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {'tiếng Nhật'}
                </Box>
                {' bắt đầu tại đây'}
              </Typography>

              <Typography
                variant="h6"
                sx={{
                  color: '#b0bdd0',
                  fontWeight: 400,
                  lineHeight: 1.7,
                  mb: 4,
                  fontSize: { xs: '1rem', md: '1.1rem' },
                  pr: { md: 4 }
                }}
              >
                {'Nền tảng học tiếng Nhật trực tuyến hàng đầu. Kết nối bạn với những giảng viên xuất sắc nhất. Giáo trình chuẩn JLPT N5→N1, hỗ trợ AI thông minh và cam kết chất lượng đầu ra.'}
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 5 }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate(ROUTES.PUBLIC.COURSE_BROWSE)}
                  endIcon={<AutoStoriesIcon />}
                  sx={{
                    py: 1.8,
                    px: 5,
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #C41E3A 0%, #E8432A 100%)',
                    color: '#ffffff',
                    fontWeight: 700,
                    textTransform: 'none',
                    fontSize: '1.1rem',
                    boxShadow: '0 8px 24px rgba(196, 30, 58, 0.35)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #A8182F 0%, #D13A24 100%)',
                      transform: 'translateY(-3px)',
                      boxShadow: '0 16px 32px rgba(196, 30, 58, 0.45)'
                    }
                  }}
                >
                  {'Khám phá khóa học'}
                </Button>

                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate(ROUTES.TEACHER.KYC)}
                  sx={{
                    py: 1.8,
                    px: 5,
                    borderRadius: '12px',
                    borderColor: 'rgba(255,255,255,0.3)',
                    borderWidth: '1.5px',
                    color: '#ffffff',
                    fontWeight: 700,
                    textTransform: 'none',
                    fontSize: '1.1rem',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: 'rgba(196, 30, 58, 0.6)',
                      bgcolor: 'rgba(196, 30, 58, 0.08)',
                      transform: 'translateY(-3px)'
                    }
                  }}
                >
                  {'Trở thành giảng viên'}
                </Button>
              </Box>

              {/* Stats bar */}
              <Box
                sx={{
                  display: 'flex',
                  gap: { xs: 3, md: 5 },
                  flexWrap: 'wrap',
                  pt: 4,
                  borderTop: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {[
                  { value: '500+', label: 'Học viên' },
                  { value: '50+', label: 'Khóa học' },
                  { value: '10+', label: 'Giảng viên' },
                ].map((stat, i) => (
                  <Box key={i} sx={{ textAlign: 'left' }}>
                    <Typography sx={{ color: '#ffffff', fontWeight: 800, fontSize: '1.6rem', lineHeight: 1.2 }}>
                      {stat.value}
                    </Typography>
                    <Typography sx={{ color: '#7a8ba8', fontSize: '0.85rem', fontWeight: 500 }}>
                      {stat.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>

          {/* Right Content (Teacher Images Slider) - 45% */}
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
            {/* Floating JLPT badge */}
            <Box
              sx={{
                position: 'absolute',
                top: { xs: 10, md: 20 },
                left: { xs: 10, md: -10 },
                bgcolor: 'rgba(196, 30, 58, 0.9)',
                color: '#fff',
                px: 2.5, py: 1,
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.8rem',
                letterSpacing: '0.05em',
                boxShadow: '0 4px 16px rgba(196, 30, 58, 0.3)',
                zIndex: 10,
                animation: 'floatBadge 4s ease-in-out infinite',
                '@keyframes floatBadge': {
                  '0%, 100%': { transform: 'translateY(0)' },
                  '50%': { transform: 'translateY(-8px)' },
                }
              }}
            >
              JLPT N5 → N1
            </Box>

            {/* Kanji watermark */}
            <Typography
              sx={{
                position: 'absolute',
                top: { xs: -20, md: -30 },
                right: { xs: 0, md: 10 },
                fontSize: { xs: '6rem', md: '9rem' },
                fontWeight: 900,
                color: 'rgba(255,255,255,0.03)',
                lineHeight: 1,
                zIndex: 0,
                userSelect: 'none',
                pointerEvents: 'none',
              }}
            >
              学
            </Typography>

            {/* Circular Image Container */}
            <Box
              sx={{
                width: '100%',
                maxWidth: { xs: '380px', md: '480px' },
                aspectRatio: '1/1',
                borderRadius: '50%',
                overflow: 'hidden',
                position: 'relative',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255,255,255,0.05)',
                border: '4px solid rgba(255,255,255,0.1)',
                bgcolor: '#1B2A4A',
                zIndex: 1,
                mb: 4,
                transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'scale(1.03)',
                  boxShadow: '0 24px 70px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(196, 30, 58, 0.2)',
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
                    transform: currentIndex === index ? 'scale(1)' : 'scale(1.12)',
                    transition: 'opacity 1.2s ease-in-out, transform 1.5s ease-in-out',
                  }}
                />
              ))}
            </Box>

            {/* Mini avatar navigation row */}
            <Box sx={{ display: 'flex', gap: 1.5, zIndex: 2, justifyContent: 'center', width: '100%' }}>
              {SLIDER_DATA.map((data, index) => (
                <Box
                  key={`avatar-${index}`}
                  onClick={() => setCurrentIndex(index)}
                  sx={{
                    width: currentIndex === index ? 48 : 40,
                    height: currentIndex === index ? 48 : 40,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: currentIndex === index
                      ? '3px solid #C41E3A'
                      : '2px solid rgba(255,255,255,0.2)',
                    cursor: 'pointer',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    opacity: currentIndex === index ? 1 : 0.6,
                    boxShadow: currentIndex === index
                      ? '0 0 16px rgba(196, 30, 58, 0.4)'
                      : 'none',
                    '&:hover': {
                      opacity: 1,
                      borderColor: 'rgba(196, 30, 58, 0.5)',
                      transform: 'scale(1.1)',
                    }
                  }}
                >
                  <Box
                    component="img"
                    src={data.teacherImg}
                    alt={data.teacherName}
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};
