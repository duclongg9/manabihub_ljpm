import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Container,
  Grid,
  Paper,
  Typography,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArticleIcon from '@mui/icons-material/Article';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HeadphonesIcon from '@mui/icons-material/Headphones';
import ChromeReaderModeIcon from '@mui/icons-material/ChromeReaderMode';
import EditIcon from '@mui/icons-material/Edit';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../shared/constants/routes';
import { getAsset } from '../../../shared/utils/assets';

const CATEGORIES = [
  { id: 'jlptLevel=N5', name: 'JLPT N5', icon: <AssignmentIcon sx={{ fontSize: 32, color: '#3b82f6' }} /> },
  { id: 'jlptLevel=N4', name: 'JLPT N4', icon: <AssignmentIcon sx={{ fontSize: 32, color: '#3b82f6' }} /> },
  { id: 'jlptLevel=N3', name: 'JLPT N3', icon: <AssignmentIcon sx={{ fontSize: 32, color: '#3b82f6' }} /> },
  { id: 'jlptLevel=N2', name: 'JLPT N2', icon: <AssignmentIcon sx={{ fontSize: 32, color: '#3b82f6' }} /> },
  { id: 'jlptLevel=N1', name: 'JLPT N1', icon: <AssignmentIcon sx={{ fontSize: 32, color: '#3b82f6' }} /> },
  { id: 'category=vocabulary', name: 'Từ vựng (Goi)', icon: <TextSnippetIcon sx={{ fontSize: 32, color: '#10b981' }} /> },
  { id: 'category=grammar', name: 'Ngữ pháp (Bunpou)', icon: <MenuBookIcon sx={{ fontSize: 32, color: '#10b981' }} /> },
  { id: 'category=jlpt-prep', name: 'Luyện thi JLPT', icon: <HeadphonesIcon sx={{ fontSize: 32, color: '#f59e0b' }} /> },
  { id: 'category=conversation', name: 'Giao tiếp', icon: <ChromeReaderModeIcon sx={{ fontSize: 32, color: '#f59e0b' }} /> },
  { id: 'category=kanji', name: 'Hán tự (Kanji)', icon: <EditIcon sx={{ fontSize: 32, color: '#8b5cf6' }} /> },
  { id: 'category=business-japanese', name: 'Tiếng Nhật Thương mại', icon: <AssignmentIcon sx={{ fontSize: 32, color: '#3b82f6' }} /> },
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
      { threshold: 0.1, rootMargin: '0px' }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <Box ref={sectionRef} sx={{ py: 10, bgcolor: '#ffffff', overflowX: 'hidden' }}>
      <Container disableGutters sx={{ maxWidth: { md: '1157px' }, px: { xs: 3, md: 0 }, margin: '0 auto' }}>

        <Box sx={{ mb: { xs: 10, md: 14 } }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: { xs: 'flex-start', md: 'flex-end' },
              justifyContent: 'space-between',
              gap: 3,
              mb: 4,
            }}
          >
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                <ArticleIcon sx={{ fontSize: 18, color: '#3b82f6', mr: 1 }} />
                <Typography variant="overline" sx={{ color: '#3b82f6', fontWeight: 600, letterSpacing: '0.05em', fontSize: '0.85rem' }}>
                  DANH MỤC KHÓA HỌC
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.3, fontSize: { xs: '2rem', md: '2.5rem' } }}>
                Khám phá các danh mục học tập
              </Typography>
            </Box>

            <Button
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate(ROUTES.PUBLIC.COURSE_BROWSE)}
              sx={{
                bgcolor: '#2563eb',
                py: 1.5,
                px: 3,
                fontWeight: 600,
                borderRadius: 1,
                boxShadow: 'none',
                textTransform: 'uppercase',
                '&:hover': {
                  bgcolor: '#1d4ed8',
                  boxShadow: '0 4px 14px rgba(37,99,235,0.4)'
                }
              }}
            >
              XEM TẤT CẢ DANH MỤC
            </Button>
          </Box>

          <Grid container spacing={2}>
            {CATEGORIES.map((category) => (
              <Grid key={category.id} size={{ xs: 12, sm: 6, md: 3 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    minHeight: 190,
                    textAlign: 'center',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    transition: 'transform 160ms ease, box-shadow 160ms ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 3,
                    },
                  }}
                >
                  <Box
                    sx={{
                      mb: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      bgcolor: '#eff6ff'
                    }}
                  >
                    {category.icon}
                  </Box>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 700, color: '#1e293b', mb: 2 }}
                  >
                    {category.name}
                  </Typography>
                  <Button
                    endIcon={<ArrowForwardIcon fontSize="small" />}
                    sx={{ mt: 'auto', fontWeight: 700 }}
                    onClick={() => navigate(`${ROUTES.PUBLIC.COURSE_BROWSE}?${category.id}`)}
                  >
                    Xem khóa học
                  </Button>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* ======================================= */}
        {/* BOTTOM BLOCK: INTRODUCTION              */}
        {/* ======================================= */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 0 }}>

          {/* LEFT: Image (578.5 x 583.67) */}
          <Box
            sx={{
              width: { xs: '100%', md: '578.5px' },
              height: { xs: 'auto', md: '583.67px' },
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateX(0)' : 'translateX(-40px)',
              transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1) 0.2s',
            }}
          >
            <Box
              component="img"
              src={getAsset('hero.png')}
              alt="ManabiHub"
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
                borderRadius: 2,
              }}
            />
          </Box>

          {/* RIGHT: Content (578.5 x 583.67) */}
          <Box
            sx={{
              width: { xs: '100%', md: '578.5px' },
              height: { xs: 'auto', md: '583.67px' },
              pl: { xs: 0, md: 5 },
              pt: { xs: 5, md: 0 },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateX(0)' : 'translateX(40px)',
              transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1) 0.4s',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
              <ArticleIcon sx={{ fontSize: 18, color: '#3b82f6', mr: 1 }} />
              <Typography variant="overline" sx={{ color: '#3b82f6', fontWeight: 600, letterSpacing: '0.05em', fontSize: '0.85rem' }}>
                GIỚI THIỆU
              </Typography>
            </Box>

            <Typography variant="h2" sx={{ fontWeight: 800, color: '#0f172a', mb: 2.5, letterSpacing: '-0.02em', lineHeight: 1.2, fontSize: { xs: '2rem', md: '2.5rem', lg: '2.8rem' } }}>
              Chào Mừng Đến Với ManabiHub
            </Typography>

            <Typography variant="body1" sx={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.7, mb: 2 }}>
              Bạn muốn nâng cao kiến thức và kỹ năng của mình? Bạn muốn học những khóa học chất lượng<br />
              từ các giảng viên tiếng Nhật? Hãy khám phá các khóa học đang có trên ManabiHub.
            </Typography>

            <Typography variant="body1" sx={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.7, mb: 4 }}>
              Chúng tôi là một nền tảng học tiếng nhật trực tuyến cung cấp một loạt các khóa học<br />
              đa dạng và chất lượng, từ JLPTN1-5. Với đội ngũ giảng viên giàu kinh nghiệm và kiến thức<br />
              chuyên môn sâu rộng, chúng tôi cam kết mang đến cho bạn những khóa học chất lượng cao<br />
              và mang tính thực tiễn.
            </Typography>

            {/* Checklist & Small Image Group */}
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              <Box
                component="img"
                src={getAsset('course2.png')}
                sx={{
                  width: '160px',
                  height: '110px',
                  objectFit: 'cover',
                  borderRadius: 2,
                }}
              />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {[
                  'Tìm khóa học phù hợp với trình độ và mục tiêu',
                  'Học theo nội dung và lộ trình của từng khóa học',
                  'Tìm người hướng dẫn phù hợp cho bạn'
                ].map((item, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start' }}>
                    <CheckCircleIcon sx={{ color: '#2563eb', mr: 1.5, fontSize: 18, mt: 0.3 }} />
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem' }}>
                      {item}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>

          </Box>
        </Box>
      </Container>
    </Box>
  );
};
