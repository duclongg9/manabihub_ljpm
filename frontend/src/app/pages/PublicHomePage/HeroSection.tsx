import React from 'react';
import { Box, Container, Typography, Button } from '@mui/material';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../shared/constants/routes';
import { getAsset } from '../../../shared/utils/assets';

// Japanese Seigaiha pattern as inline SVG data URI
const SEIGAIHA_PATTERN = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill='%23ffffff' fill-opacity='0.04' d='M120 120c-33.137 0-60-26.863-60-60 0-33.137 26.863-60 60-60 33.137 0 60 26.863 60 60 0 33.137-26.863 60-60 60zm-60-60c-33.137 0-60-26.863-60-60 0-33.137 26.863-60 60-60 33.137 0 60 26.863 60 60 0 33.137-26.863 60-60 60zm0 120c-33.137 0-60-26.863-60-60 0-33.137 26.863-60 60-60 33.137 0 60 26.863 60 60 0 33.137-26.863 60-60 60zM0 60c-33.137 0-60-26.863-60-60 0-33.137 26.863-60 60-60 33.137 0 60 26.863 60 60 0 33.137-26.863 60-60 60z'/%3E%3C/svg%3E")`;

export const HeroSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: { xs: '75vh', md: '85vh' },
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #1B2A4A 0%, #0F1D36 60%, #0A1628 100%)',
      }}
    >
      {/* Wave pattern overlay */}
      <Box
        sx={{
          position: 'absolute', top: 0, left: 0,
          width: '100%', height: '100%',
          backgroundImage: SEIGAIHA_PATTERN,
          backgroundRepeat: 'repeat',
          zIndex: 0,
        }}
      />

      {/* Ambient glow - vermilion */}
      <Box
        sx={{
          position: 'absolute', top: '10%', right: '20%',
          width: '40%', height: '60%',
          background: 'radial-gradient(circle, rgba(196, 30, 58, 0.07) 0%, rgba(0,0,0,0) 70%)',
          zIndex: 0,
        }}
      />

      {/* Floating sakura-inspired particles */}
      {[...Array(5)].map((_, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            width: { xs: 6, md: 8 },
            height: { xs: 6, md: 8 },
            borderRadius: '50%',
            bgcolor: i % 2 === 0 ? 'rgba(196, 30, 58, 0.15)' : 'rgba(255, 183, 197, 0.12)',
            left: `${15 + i * 18}%`,
            top: `${20 + (i % 3) * 25}%`,
            zIndex: 0,
            animation: `sakuraFloat${i} ${6 + i * 2}s ease-in-out infinite`,
            [`@keyframes sakuraFloat${i}`]: {
              '0%, 100%': { transform: 'translateY(0) rotate(0deg)', opacity: 0.6 },
              '50%': { transform: `translateY(-${15 + i * 5}px) rotate(${45 + i * 30}deg)`, opacity: 1 },
            },
          }}
        />
      ))}

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column-reverse', md: 'row' },
            alignItems: 'center',
            gap: { xs: 4, md: 6 }
          }}
        >
          {/* Left Content (Text + Buttons) - 50% */}
          <Box sx={{ width: { xs: '100%', md: '50%' } }}>
            <Box
              sx={{
                animation: 'heroFadeIn 1s cubic-bezier(0.22, 1, 0.36, 1) forwards',
                '@keyframes heroFadeIn': {
                  '0%': { opacity: 0, transform: 'translateY(24px)' },
                  '100%': { opacity: 1, transform: 'translateY(0)' }
                }
              }}
            >
              {/* Japanese accent */}
              <Typography
                sx={{
                  fontFamily: '"Noto Sans JP", sans-serif',
                  color: 'rgba(196, 30, 58, 0.75)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  letterSpacing: '0.12em',
                  mb: 2,
                }}
              >
                学ぶ ・ 成長する ・ 繋がる
              </Typography>

              <Typography
                variant="h1"
                sx={{
                  fontWeight: 800,
                  color: '#ffffff',
                  lineHeight: 1.15,
                  mb: 3,
                  fontSize: { xs: '2.4rem', md: '3.5rem' },
                  letterSpacing: '-1px'
                }}
              >
                Hành trình chinh phục{' '}
                <Box
                  component="span"
                  sx={{
                    background: 'linear-gradient(135deg, #C41E3A, #E8432A)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  tiếng Nhật
                </Box>
                {' '}bắt đầu tại đây
              </Typography>

              <Typography
                variant="h6"
                sx={{
                  color: '#b0bdd0',
                  fontWeight: 400,
                  lineHeight: 1.7,
                  mb: 5,
                  fontSize: { xs: '1rem', md: '1.1rem' },
                  pr: { md: 2 },
                  maxWidth: 520,
                }}
              >
                Nền tảng học tiếng Nhật trực tuyến hàng đầu. Giáo trình chuẩn JLPT N5→N1, hỗ trợ AI thông minh và đội ngũ giảng viên được kiểm duyệt KYC nghiêm ngặt.
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate(ROUTES.PUBLIC.COURSE_BROWSE)}
                  endIcon={<AutoStoriesIcon />}
                  sx={{
                    py: 1.8, px: 5,
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
                  Khám phá khóa học
                </Button>

                {/* Hanko Stamp */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 44,
                    height: 44,
                    bgcolor: 'transparent',
                    border: '3px solid #E8432A',
                    borderRadius: '4px',
                    transform: 'rotate(-8deg)',
                    mt: { xs: 0, md: 0 },
                    ml: { xs: 0, md: -1 },
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: '"Noto Serif JP", serif',
                      fontWeight: 900,
                      color: '#E8432A',
                      fontSize: '1.2rem',
                      lineHeight: 1,
                    }}
                  >
                    合格
                  </Typography>
                </Box>

                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate(ROUTES.TEACHER.KYC)}
                  sx={{
                    py: 1.8, px: 5,
                    borderRadius: '12px',
                    borderColor: '#ffffff',
                    borderWidth: '2px',
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
                  Trở thành giảng viên
                </Button>
              </Box>
            </Box>
          </Box>

          {/* Right Content (Illustration) - 50% */}
          <Box
            sx={{
              width: { xs: '100%', md: '50%' },
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
              animation: 'heroImgIn 1.2s cubic-bezier(0.22, 1, 0.36, 1) 0.2s both',
              '@keyframes heroImgIn': {
                '0%': { opacity: 0, transform: 'translateY(30px) scale(0.95)' },
                '100%': { opacity: 1, transform: 'translateY(0) scale(1)' }
              }
            }}
          >
            {/* Kanji watermark behind illustration */}
            <Typography
              sx={{
                position: 'absolute',
                top: { xs: -10, md: -20 },
                right: { xs: 0, md: 20 },
                fontSize: { xs: '7rem', md: '10rem' },
                fontWeight: 900,
                fontFamily: '"Noto Sans JP", serif',
                color: 'rgba(255,255,255,0.025)',
                lineHeight: 1,
                zIndex: 0,
                userSelect: 'none',
                pointerEvents: 'none',
              }}
            >
              学
            </Typography>

            {/* Illustration image */}
            <Box
              component="img"
              src={getAsset('hero_illustration.png')}
              alt="Học tiếng Nhật cùng ManabiHub"
              sx={{
                width: '100%',
                maxWidth: { xs: 360, md: 520 },
                height: 'auto',
                objectFit: 'contain',
                position: 'relative',
                zIndex: 1,
                filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.3))',
                transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'scale(1.03) translateY(-4px)',
                }
              }}
            />

            {/* Floating JLPT badge */}
            <Box
              sx={{
                position: 'absolute',
                bottom: { xs: 10, md: 30 },
                left: { xs: 0, md: -10 },
                bgcolor: '#FFF8E1',
                color: '#1A1A2E',
                display: 'flex', alignItems: 'center', gap: 1,
                px: 2.5, py: 1.2,
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.85rem',
                letterSpacing: '0.02em',
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                zIndex: 10,
                animation: 'floatBadge 4s ease-in-out infinite',
                '@keyframes floatBadge': {
                  '0%, 100%': { transform: 'translateY(0)' },
                  '50%': { transform: 'translateY(-8px)' },
                }
              }}
            >
              <MenuBookIcon sx={{ color: '#D4A017', fontSize: 18 }} />
              JLPT N5 → N1
            </Box>

            {/* Floating sakura badge */}
            <Box
              sx={{
                position: 'absolute',
                top: { xs: 20, md: 40 },
                right: { xs: 10, md: 0 },
                bgcolor: 'rgba(255, 255, 255, 0.95)',
                color: '#1A1A2E',
                display: 'flex', alignItems: 'center', gap: 1,
                px: 2.5, py: 1.2,
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.85rem',
                boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                zIndex: 10,
                animation: 'floatBadge2 5s ease-in-out 1s infinite',
                '@keyframes floatBadge2': {
                  '0%, 100%': { transform: 'translateY(0)' },
                  '50%': { transform: 'translateY(-6px)' },
                }
              }}
            >
              <AutoAwesomeIcon sx={{ color: '#C41E3A', fontSize: 18 }} />
              AI Trợ lý học tập
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};
