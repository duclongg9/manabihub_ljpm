import React, { useState, useEffect, useRef } from 'react';
import { Box, Container, Grid, Typography, Paper } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LaptopMacIcon from '@mui/icons-material/LaptopMac';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';

const FEATURES = [
  {
    icon: <SearchIcon sx={{ fontSize: 36, color: '#C41E3A' }} />,
    title: 'Tìm kiếm khóa học',
    description: 'Dễ dàng tìm kiếm và lựa chọn khóa học phù hợp với mục tiêu JLPT hoặc kỹ năng của bạn.',
    accentColor: '#C41E3A',
    iconBg: '#FFF5F5'
  },
  {
    icon: <LaptopMacIcon sx={{ fontSize: 36, color: '#1B2A4A' }} />,
    title: 'Đăng ký và học tập',
    description: 'Đăng ký khóa học và xem video bài giảng chất lượng cao, linh hoạt học mọi lúc mọi nơi.',
    accentColor: '#1B2A4A',
    iconBg: '#F0F4FA'
  },
  {
    icon: <TaskAltIcon sx={{ fontSize: 36, color: '#D4A017' }} />,
    title: 'Thực hành bài học',
    description: 'Làm bài tập trắc nghiệm và thực hành đa dạng để củng cố kiến thức ngay sau mỗi bài học.',
    accentColor: '#D4A017',
    iconBg: '#FFFBEB'
  },
  {
    icon: <SmartToyOutlinedIcon sx={{ fontSize: 36, color: '#5B8C5A' }} />,
    title: 'Trợ lý AI hỗ trợ học tập',
    description: 'Nhận gợi ý và giải đáp từ AI. (Lưu ý: AI đóng vai trò hỗ trợ tham khảo, không chấm điểm chính thức).',
    accentColor: '#5B8C5A',
    iconBg: '#F0FAF0'
  }
];

export const FeaturesSection: React.FC = () => {
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
    <Box
      ref={sectionRef}
      sx={{
        py: 12,
        background: 'linear-gradient(180deg, #FBF9F5 0%, #FFFFFF 100%)',
        perspective: '1000px'
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5 }}>
          <Box sx={{ width: 4, height: 20, bgcolor: '#C41E3A', borderRadius: 2, mr: 1.5 }} />
          <Typography variant="overline" sx={{ color: '#C41E3A', fontWeight: 700, letterSpacing: '0.08em', fontSize: '0.85rem' }}>
            TẠI SAO CHỌN MANABIHUB
          </Typography>
        </Box>
        <Typography variant="h3" sx={{ fontWeight: 800, color: '#1A1A2E', textAlign: 'center', mb: 2 }}>
          {'Lý do chọn chúng tôi'}
        </Typography>
        <Typography variant="h6" sx={{ color: '#64748b', textAlign: 'center', mb: 8, fontWeight: 400 }}>
          {'Tại sao bạn nên đồng hành cùng ManabiHub'}
        </Typography>

        <Grid container spacing={4}>
          {FEATURES.map((feature, index) => (
            <Grid
              size={{ xs: 12, sm: 6, md: 3 }}
              key={index}
              sx={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible
                  ? 'translateZ(0) translateY(0) rotateX(0deg) scale(1)'
                  : 'translateZ(-200px) translateY(80px) rotateX(-20deg) scale(0.9)',
                transition: `all 1.2s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.15}s`,
                transformStyle: 'preserve-3d'
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  borderRadius: '20px',
                  bgcolor: '#ffffff',
                  border: '1.5px solid #e8e0d8',
                  borderLeft: `4px solid ${feature.accentColor}`,
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    borderColor: feature.accentColor,
                    boxShadow: `0 16px 40px ${feature.accentColor}12`,
                  },
                  // Gradient shine sweep on hover
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: 0, left: '-100%',
                    width: '100%', height: '100%',
                    background: `linear-gradient(90deg, transparent, ${feature.accentColor}08, transparent)`,
                    transition: 'left 0.6s ease',
                  },
                  '&:hover::after': {
                    left: '100%',
                  }
                }}
              >
                <Box
                  sx={{
                    width: 72, height: 72, borderRadius: '18px', bgcolor: feature.iconBg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3,
                    transition: 'transform 0.3s ease',
                  }}
                >
                  {feature.icon}
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1A1A2E', mb: 2, fontSize: '1.05rem' }}>
                  {feature.title}
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', lineHeight: 1.7 }}>
                  {feature.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};
