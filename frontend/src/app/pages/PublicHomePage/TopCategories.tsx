import React, { useState, useEffect, useRef } from 'react';
import { Box, Container, Typography, Grid, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../shared/constants/routes';

const CATEGORIES = [
  { id: 'n5', name: 'Luyện thi N5', count: 12 },
  { id: 'n4', name: 'Luyện thi N4', count: 15 },
  { id: 'n3', name: 'Luyện thi N3', count: 23 },
  { id: 'n2', name: 'Luyện thi N2', count: 18 },
  { id: 'n1', name: 'Luyện thi N1', count: 10 },
  { id: 'vocabulary', name: 'Từ vựng', count: 34 },
  { id: 'grammar', name: 'Ngữ pháp', count: 28 },
  { id: 'listening', name: 'Nghe hiểu', count: 15 },
  { id: 'reading', name: 'Đọc hiểu', count: 21 },
  { id: 'writing', name: 'Viết', count: 9 },
];

export const TopCategories: React.FC = () => {
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
      { threshold: 0.2, rootMargin: '0px' }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <Box ref={sectionRef} sx={{ py: 10, bgcolor: '#ffffff', perspective: '1200px' }}>
      <Container maxWidth="lg">
        <Typography variant="h3" sx={{ fontWeight: 800, color: '#0f172a', mb: 5, letterSpacing: '-0.5px' }}>
          Khám phá danh mục hàng đầu
        </Typography>

        <Grid container spacing={3}>
          {CATEGORIES.map((category, index) => (
            <Grid 
              size={{ xs: 12, sm: 6, md: 3 }} 
              key={category.id}
              sx={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible 
                  ? 'translateZ(0) translateY(0) rotateY(0deg) scale(1)' 
                  : 'translateZ(-200px) translateY(50px) rotateY(-20deg) scale(0.9)',
                transition: `all 1.2s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.1}s`,
                transformStyle: 'preserve-3d'
              }}
            >
              <Paper
                elevation={0}
                onClick={() => navigate(ROUTES.PUBLIC.COURSE_BROWSE)}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: '1px solid transparent',
                  bgcolor: '#f8fafc',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: '#bfdbfe',
                    bgcolor: '#eff6ff',
                    boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.1)',
                    transform: 'translateY(-4px)'
                  }
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
                  {category.name}
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  {category.count} Khóa học
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};
