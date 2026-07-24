import React, { useState, useEffect, useRef } from 'react';
import { Box, Container, Typography, Button, Paper, Divider, Grid } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../shared/constants/routes';
import { getAsset } from '../../../shared/utils/assets';

const INSTRUCTORS = [
  {
    id: 1,
    name: 'Đức Long',
    title: 'Giảng viên JLPT',
    image: getAsset('teacher1.png'),
    courses: 2,
    students: '60+',
    quote: '学びは毎日の積み重ね',
    quoteMeaning: 'Học tập là sự tích lũy mỗi ngày',
  },
  {
    id: 2,
    name: 'Tuấn Hưng',
    title: 'Giảng viên Ngữ pháp',
    image: getAsset('teacher2.png'),
    courses: 4,
    students: '30+',
    quote: '努力は裏切らない',
    quoteMeaning: 'Nỗ lực sẽ không phản bội bạn',
  },
  {
    id: 3,
    name: 'Thành Yến',
    title: 'Giảng viên Giao tiếp',
    image: getAsset('teacher3.png'),
    courses: 3,
    students: '50+',
    quote: '言葉は心の架け橋',
    quoteMeaning: 'Ngôn ngữ là cầu nối tâm hồn',
  },
];

export const TopInstructorsSection: React.FC = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.1, rootMargin: '0px' }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <Box ref={sectionRef} sx={{ py: { xs: 8, md: 12 }, bgcolor: '#FBF9F5' }}>
      <Container disableGutters sx={{ maxWidth: { md: '1157px' }, px: { xs: 3, md: 0 }, margin: '0 auto' }}>

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 4, md: 0 } }}>

          {/* Left Side: Text and Buttons */}
          <Box
            sx={{
              width: { xs: '100%', md: '35%' },
              pr: { xs: 0, md: 4 },
              display: 'flex', flexDirection: 'column', justifyContent: 'center',
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateX(0)' : 'translateX(-50px)',
              transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box sx={{ width: 4, height: 20, bgcolor: '#C41E3A', borderRadius: 2, mr: 1.5 }} />
              <Typography variant="overline" sx={{ color: '#C41E3A', fontWeight: 700, letterSpacing: '0.08em', fontSize: '0.85rem' }}>
                GIẢNG VIÊN CỦA CHÚNG TÔI
              </Typography>
            </Box>

            <Typography variant="h2" sx={{ fontWeight: 800, color: '#1A1A2E', mb: 3, letterSpacing: '-0.02em', lineHeight: 1.2, fontSize: { xs: '2.2rem', md: '2.8rem' } }}>
              Gặp Gỡ Giảng Viên Chuyên Nghiệp
            </Typography>

            <Typography variant="body1" sx={{ color: '#475569', fontSize: '1.05rem', lineHeight: 1.7, mb: 3 }}>
              Giảng viên của chúng tôi là những chuyên gia tận tâm, được tuyển chọn kỹ lưỡng qua quy trình KYC nghiêm ngặt.
            </Typography>

            <Typography variant="body1" sx={{ color: '#475569', fontSize: '1.05rem', lineHeight: 1.7, mb: 5 }}>
              Không chỉ có kiến thức sắc bén, mà còn có khả năng truyền đạt và tạo động lực cho học viên trên hành trình chinh phục tiếng Nhật.
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate(ROUTES.PUBLIC.COURSE_BROWSE)}
                sx={{
                  background: 'linear-gradient(135deg, #C41E3A, #E8432A)',
                  py: 1.5, px: 4, fontWeight: 700, borderRadius: '10px',
                  boxShadow: '0 4px 16px rgba(196, 30, 58, 0.25)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #A8182F, #D13A24)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 24px rgba(196,30,58,0.4)',
                  }
                }}
              >
                KHÁM PHÁ KHÓA HỌC
              </Button>
            </Box>
          </Box>

          {/* Right Side: Instructor Cards */}
          <Box sx={{ width: { xs: '100%', md: '65%' } }}>
            <Grid container spacing={3}>
            {INSTRUCTORS.map((instructor, index) => (
              <Grid
                size={{ xs: 12, sm: 6 }}
                key={instructor.id}
                sx={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(50px)',
                  transition: `all 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.2}s`,
                }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: '20px',
                    bgcolor: '#ffffff',
                    border: '1px solid #f1f5f9',
                    p: 3,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateY(-6px)',
                      boxShadow: '0 16px 32px rgba(0,0,0,0.06)',
                      borderColor: '#e2e8f0',
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mb: 3 }}>
                    <Box sx={{ position: 'relative' }}>
                      <Box
                        sx={{
                          width: 64, height: 64,
                          borderRadius: '50%',
                          backgroundImage: `url(${instructor.image})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          border: '2px solid #fff',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                      />
                      {/* KYC Verified Badge */}
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 0, right: -4,
                          width: 20, height: 20,
                          bgcolor: '#10b981',
                          borderRadius: '50%',
                          border: '2px solid #fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: '0 2px 4px rgba(16, 185, 129, 0.4)',
                        }}
                      >
                        <Typography sx={{ color: '#fff', fontSize: '0.6rem', fontWeight: 'bold' }}>✓</Typography>
                      </Box>
                    </Box>

                    <Box>
                      <Typography sx={{ fontWeight: 800, color: '#1A1A2E', fontSize: '1.15rem' }}>
                        {instructor.name}
                      </Typography>
                      <Typography sx={{ color: '#C41E3A', fontWeight: 600, fontSize: '0.85rem' }}>
                        {instructor.title}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Japanese Quote Bubble */}
                  <Box
                    sx={{
                      bgcolor: '#F8FAFC',
                      borderRadius: '12px',
                      p: 2,
                      mb: 3,
                      position: 'relative',
                      border: '1px solid #e2e8f0',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: -6, left: 24,
                        width: 12, height: 12,
                        bgcolor: '#F8FAFC',
                        borderTop: '1px solid #e2e8f0',
                        borderLeft: '1px solid #e2e8f0',
                        transform: 'rotate(45deg)',
                      }
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: '"Noto Sans JP", sans-serif',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        color: '#1A1A2E',
                        lineHeight: 1.5,
                        mb: 0.5,
                      }}
                    >
                      「{instructor.quote}」
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic' }}>
                      {instructor.quoteMeaning}
                    </Typography>
                  </Box>

                  <Box sx={{ mt: 'auto' }}>
                    <Divider sx={{ mb: 2, borderColor: '#f1f5f9' }} />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <MenuBookIcon sx={{ fontSize: 16, mr: 0.5, color: '#94a3b8' }} />
                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748b' }}>
                          {instructor.courses} Khóa học
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PeopleAltIcon sx={{ fontSize: 16, mr: 0.5, color: '#94a3b8' }} />
                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748b' }}>
                          {instructor.students} Học viên
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            ))}
            </Grid>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};
