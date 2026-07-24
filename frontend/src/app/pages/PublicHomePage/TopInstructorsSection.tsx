import React, { useState, useEffect, useRef } from 'react';
import { Box, Container, Typography, Button, Paper, Divider } from '@mui/material';
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
              width: { xs: '100%', md: '40%' },
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
              <Button
                variant="outlined"
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate(ROUTES.PUBLIC.ABOUT)}
                sx={{
                  py: 1.5, px: 4, fontWeight: 700, borderRadius: '10px',
                  borderColor: '#1B2A4A', borderWidth: '1.5px', color: '#1B2A4A',
                  transition: 'all 0.3s ease',
                  '&:hover': { borderColor: '#C41E3A', color: '#C41E3A', bgcolor: 'rgba(196, 30, 58, 0.04)', transform: 'translateY(-2px)' }
                }}
              >
                TÌM HIỂU THÊM
              </Button>
            </Box>
          </Box>

          {/* Right Side: Instructor Cards */}
          <Box
            sx={{
              width: { xs: '100%', md: '60%' },
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2.5,
              justifyContent: 'center',
              alignContent: 'center',
            }}
          >
            {INSTRUCTORS.map((instructor, index) => (
              <Box
                key={instructor.id}
                sx={{
                  width: { xs: '100%', sm: 'calc(50% - 10px)' },
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(50px)',
                  transition: `all 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.2}s`,
                }}
              >
                <Box
                  sx={{
                    position: 'relative',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    bgcolor: '#f1f5f9',
                    width: '100%',
                    height: '320px',
                    cursor: 'pointer',
                    '&:hover .instructor-info': { transform: 'translateY(0)', opacity: 1 },
                    '&:hover .instructor-img': { transform: 'scale(1.05)' },
                    '&:hover .instructor-name-bar': { opacity: 0 },
                  }}
                >
                  {/* Instructor Image */}
                  <Box
                    className="instructor-img"
                    sx={{
                      width: '100%', height: '100%',
                      backgroundImage: `url(${instructor.image})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      transition: 'transform 0.5s ease',
                    }}
                  />

                  {/* Static name bar (visible by default, hidden on hover) */}
                  <Box
                    className="instructor-name-bar"
                    sx={{
                      position: 'absolute',
                      bottom: 0, left: 0, right: 0,
                      background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                      p: 2, pt: 4,
                      transition: 'opacity 0.3s ease',
                    }}
                  >
                    <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '1.05rem' }}>
                      {instructor.name}
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', fontWeight: 600 }}>
                      {instructor.title}
                    </Typography>
                  </Box>

                  {/* Detailed hover panel with quote */}
                  <Paper
                    className="instructor-info"
                    elevation={0}
                    sx={{
                      position: 'absolute',
                      bottom: 0, left: 0, right: 0,
                      bgcolor: '#ffffff',
                      p: 2.5,
                      transform: 'translateY(100%)',
                      opacity: 0,
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      borderTopRightRadius: 20, borderTopLeftRadius: 20,
                      boxShadow: '0 -10px 40px rgba(0,0,0,0.08)'
                    }}
                  >
                    <Typography sx={{ fontWeight: 800, color: '#1A1A2E', mb: 0.3, fontSize: '1.1rem' }}>
                      {instructor.name}
                    </Typography>
                    <Typography sx={{ color: '#C41E3A', fontWeight: 600, mb: 1.5, fontSize: '0.8rem' }}>
                      {instructor.title}
                    </Typography>

                    <Divider sx={{ mb: 1.5 }} />

                    {/* Stats */}
                    <Box sx={{ display: 'flex', alignItems: 'center', color: '#64748b', gap: 2, mb: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <MenuBookIcon sx={{ fontSize: 14, mr: 0.5, color: '#C41E3A' }} />
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>{instructor.courses} Khóa học</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PeopleAltIcon sx={{ fontSize: 14, mr: 0.5, color: '#D4A017' }} />
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>{instructor.students} Học viên</Typography>
                      </Box>
                    </Box>

                    {/* Quote in hover panel */}
                    <Box
                      sx={{
                        bgcolor: '#FBF9F5',
                        borderRadius: '10px',
                        p: 1.5,
                        borderLeft: '3px solid #C41E3A',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                        <FormatQuoteIcon sx={{ fontSize: 16, color: '#C41E3A', transform: 'rotate(180deg)', mt: 0.2 }} />
                        <Box>
                          <Typography
                            sx={{
                              fontFamily: '"Noto Sans JP", sans-serif',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              color: '#1A1A2E',
                              lineHeight: 1.4,
                            }}
                          >
                            {instructor.quote}
                          </Typography>
                          <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8', fontStyle: 'italic', mt: 0.3 }}>
                            {instructor.quoteMeaning}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Paper>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Container>
    </Box>
  );
};
