import React, { useState, useEffect, useRef } from 'react';
import { Box, Container, Typography, Button, Paper, Divider } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArticleIcon from '@mui/icons-material/Article';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../shared/constants/routes';
import { getAsset } from '../../../shared/utils/assets';

const INSTRUCTORS = [
  {
    id: 1,
    name: 'Đức long',
    title: 'Giảng viên',
    image: getAsset('teacher1.png'),
    courses: 2,
    students: '60+',
    quote: '"Học tiếng Nhật là hành trình khám phá văn hóa."'
  },
  {
    id: 2,
    name: 'Tuấn Hưng',
    title: 'Giảng viên',
    image: getAsset('teacher2.png'),
    courses: 4,
    students: '30+',
    quote: '"Nỗ lực hôm nay, thành công ngày mai."'
  },
  {
    id: 3,
    name: 'Thành Yến',
    title: 'Giảng viên',
    image: getAsset('teacher3.png'),
    courses: 3,
    students: '50+',
    quote: '"Ngôn ngữ là cầu nối giữa các tâm hồn."'
  },
  {
    id: 4,
    name: 'Thu Hương',
    title: 'Giảng viên',
    image: getAsset('teacher4.png'),
    courses: 5,
    students: '120+',
    quote: '"Thành thạo giao tiếp chỉ sau 3 tháng."'
  }
];

export const TopInstructorsSection: React.FC = () => {
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
      { threshold: 0.1, rootMargin: '0px' }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <Box ref={sectionRef} sx={{ py: { xs: 8, md: 12 }, bgcolor: '#ffffff' }}>
      <Container disableGutters sx={{ maxWidth: { md: '1157px' }, px: { xs: 3, md: 0 }, margin: '0 auto' }}>

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 4, md: 0 } }}>

          {/* Left Side: Text and Buttons (578.5 x 575.56) */}
          <Box
            sx={{
              width: { xs: '100%', md: '578.5px' },
              height: { xs: 'auto', md: '575.56px' },
              pr: { xs: 0, md: 4 }, // Padding right to avoid text hitting the images directly
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateX(0)' : 'translateX(-50px)',
              transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <ArticleIcon sx={{ fontSize: 18, color: '#3b82f6', mr: 1 }} />
              <Typography variant="overline" sx={{ color: '#3b82f6', fontWeight: 600, letterSpacing: '0.05em', fontSize: '0.85rem' }}>
                GIẢNG VIÊN CỦA CHÚNG TÔI
              </Typography>
            </Box>

            <Typography variant="h2" sx={{ fontWeight: 800, color: '#0f172a', mb: 3, letterSpacing: '-0.02em', lineHeight: 1.2, fontSize: { xs: '2.2rem', md: '3rem' } }}>
              Gặp Gỡ Giảng Viên Chuyên Nghiệp Của Chúng Tôi
            </Typography>

            <Typography variant="body1" sx={{ color: '#475569', fontSize: '1.05rem', lineHeight: 1.7, mb: 3 }}>
              Giảng viên của chúng tôi là những chuyên gia tận tâm và giàu kinh nghiệm trong lĩnh vực của mình. Chúng tôi tự hào có đội ngũ giảng viên chuyên nghiệp, được tuyển chọn kỹ lưỡng và có trình độ học vấn cao.
            </Typography>

            <Typography variant="body1" sx={{ color: '#475569', fontSize: '1.05rem', lineHeight: 1.7, mb: 5 }}>
              Họ không chỉ có kiến thức sắc bén, mà còn có khả năng truyền đạt và tạo động lực cho học viên.
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate(ROUTES.PUBLIC.COURSE_BROWSE)}
                sx={{
                  bgcolor: '#2563eb',
                  py: 1.5,
                  px: 4,
                  fontWeight: 700,
                  borderRadius: 1,
                  boxShadow: 'none',
                  '&:hover': { bgcolor: '#1d4ed8', boxShadow: '0 4px 14px rgba(37,99,235,0.4)' }
                }}
              >
                KHÁM PHÁ KHÓA HỌC
              </Button>
              <Button
                variant="contained"
                endIcon={<ArrowForwardIcon />}
                sx={{
                  bgcolor: '#ef4444',
                  py: 1.5,
                  px: 4,
                  fontWeight: 700,
                  borderRadius: 1,
                  boxShadow: 'none',
                  '&:hover': { bgcolor: '#dc2626', boxShadow: '0 4px 14px rgba(239,68,68,0.4)' }
                }}
              >
                LIÊN HỆ
              </Button>
            </Box>
          </Box>

          {/* Right Side: Instructor Grid (578.5 x 575.56 total) */}
          <Box
            sx={{
              width: { xs: '100%', md: '578.5px' },
              height: { xs: 'auto', md: '575.56px' },
              display: 'flex',
              flexWrap: 'wrap',
              gap: 0 // Exact pixel matching implies they sit flush with each other, though we can add gaps inside their boxes
            }}
          >
            {INSTRUCTORS.map((instructor, index) => (
              <Box
                key={instructor.id}
                sx={{
                  width: { xs: '100%', sm: '50%', md: '289.25px' }, // Exact width
                  height: { xs: 'auto', sm: 'auto', md: '287.78px' }, // Exact height (575.56 / 2)
                  p: 1.5, // Padding acts as gap between cards so they don't stick completely
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(50px)',
                  transition: `all 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.2}s`,
                }}
              >
                <Box
                  sx={{
                    position: 'relative',
                    borderRadius: 4,
                    overflow: 'hidden',
                    bgcolor: '#f1f5f9',
                    width: '100%',
                    height: '100%',
                    minHeight: { xs: '250px', md: '100%' }, // For mobile
                    cursor: 'pointer',
                    '&:hover .instructor-info': {
                      transform: 'translateY(0)',
                      opacity: 1
                    },
                    '&:hover .instructor-img': {
                      transform: 'scale(1.05)'
                    }
                  }}
                >
                  {/* Instructor Image */}
                  <Box
                    className="instructor-img"
                    sx={{
                      width: '100%',
                      height: '100%',
                      backgroundImage: `url(${instructor.image})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      transition: 'transform 0.5s ease',
                      ...(!instructor.image && { background: 'linear-gradient(45deg, #3b82f6, #0ea5e9)' })
                    }}
                  />

                  {/* Blue Plus Button */}
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 12,
                      right: 12,
                      width: 40,
                      height: 40,
                      bgcolor: '#2563eb',
                      color: '#fff',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(37,99,235,0.4)',
                      zIndex: 10,
                    }}
                  >
                    <AddIcon />
                  </Box>

                  {/* Slide-up Info Panel */}
                  <Paper
                    className="instructor-info"
                    elevation={0}
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      bgcolor: '#ffffff',
                      p: 2,
                      transform: 'translateY(100%)',
                      opacity: 0,
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      borderTopRightRadius: 20,
                      borderTopLeftRadius: 20,
                      boxShadow: '0 -10px 40px rgba(0,0,0,0.08)'
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.5, fontSize: '1.1rem' }}>
                      {instructor.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#3b82f6', fontWeight: 600, mb: 1, fontSize: '0.8rem' }}>
                      {instructor.title}
                    </Typography>

                    <Divider sx={{ mb: 1.5 }} />

                    <Box sx={{ display: 'flex', alignItems: 'center', color: '#64748b', flexWrap: 'wrap', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <MenuBookIcon sx={{ fontSize: 14, mr: 0.5, color: '#94a3b8' }} />
                        <Typography variant="caption" sx={{ fontWeight: 500 }}>{instructor.courses} Khóa học</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PeopleAltIcon sx={{ fontSize: 14, mr: 0.5, color: '#94a3b8' }} />
                        <Typography variant="caption" sx={{ fontWeight: 500 }}>{instructor.students} Học viên</Typography>
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
