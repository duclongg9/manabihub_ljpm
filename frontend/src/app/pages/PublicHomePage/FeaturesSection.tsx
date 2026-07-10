import React, { useState, useEffect, useRef } from 'react';
import { Box, Container, Grid, Typography, Paper } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LaptopMacIcon from '@mui/icons-material/LaptopMac';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';

const FEATURES = [
  {
    icon: <SearchIcon sx={{ fontSize: 40, color: '#3b82f6' }} />,
    title: 'Tìm kiếm khóa học',
    description: 'Dễ dàng tìm kiếm và lựa chọn khóa học phù hợp với mục tiêu JLPT hoặc kỹ năng của bạn.',
    iconBg: '#eff6ff'
  },
  {
    icon: <LaptopMacIcon sx={{ fontSize: 40, color: '#10b981' }} />,
    title: 'Đăng ký và học tập',
    description: 'Đăng ký khóa học và xem video bài giảng chất lượng cao, linh hoạt học mọi lúc mọi nơi.',
    iconBg: '#ecfdf5'
  },
  {
    icon: <TaskAltIcon sx={{ fontSize: 40, color: '#f59e0b' }} />,
    title: 'Thực hành bài học',
    description: 'Làm bài tập trắc nghiệm và thực hành đa dạng để củng cố kiến thức ngay sau mỗi bài học.',
    iconBg: '#fffbeb'
  },
  {
    icon: <SmartToyOutlinedIcon sx={{ fontSize: 40, color: '#8b5cf6' }} />,
    title: 'Trợ lý AI hỗ trợ học tập',
    description: 'Nhận gợi ý và giải đáp từ AI. (Lưu ý: AI đóng vai trò hỗ trợ tham khảo, không chấm điểm chính thức).',
    iconBg: '#f5f3ff'
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
    <Box ref={sectionRef} sx={{ py: 12, bgcolor: '#ffffff', perspective: '1000px' }}>
      <Container maxWidth="lg">
        <Typography variant="h3" sx={{ fontWeight: 800, color: '#0f172a', textAlign: 'center', mb: 2 }}>
          Lý do chọn chúng tôi
        </Typography>
        <Typography variant="h6" sx={{ color: '#64748b', textAlign: 'center', mb: 8, fontWeight: 400 }}>
          Tại sao bạn nên đồng hành cùng ManabiHub
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
                  borderRadius: 4,
                  bgcolor: '#ffffff',
                  border: '1px solid transparent',
                  transition: 'all 0.3s ease',
                  '&:hover': { transform: 'translateY(-8px)', borderColor: '#e2e8f0', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)' }
                }}
              >
                <Box
                  sx={{
                    width: 80, height: 80, borderRadius: '50%', bgcolor: feature.iconBg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3
                  }}
                >
                  {feature.icon}
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 2, fontSize: '1.1rem' }}>
                  {feature.title}
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', lineHeight: 1.6 }}>
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
