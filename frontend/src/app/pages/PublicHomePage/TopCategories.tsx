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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../shared/constants/routes';
import { getAsset } from '../../../shared/utils/assets';

/* ─── JLPT Levels (Timeline style) ─── */
const JLPT_LEVELS = [
  { id: 'jlptLevel=N5', name: 'N5', subtitle: '初級', color: '#5B8C5A', label: 'Sơ cấp' },
  { id: 'jlptLevel=N4', name: 'N4', subtitle: '初中級', color: '#3B9979', label: 'Sơ-Trung cấp' },
  { id: 'jlptLevel=N3', name: 'N3', subtitle: '中級', color: '#D4A017', label: 'Trung cấp' },
  { id: 'jlptLevel=N2', name: 'N2', subtitle: '上級', color: '#E8432A', label: 'Cao cấp' },
  { id: 'jlptLevel=N1', name: 'N1', subtitle: '最上級', color: '#C41E3A', label: 'Thành thạo' },
];

/* ─── Skill Categories ─── */
const SKILL_CATEGORIES = [
  { id: 'category=vocabulary', name: 'Từ vựng', kanji: '語彙', color: '#5B8C5A' },
  { id: 'category=grammar', name: 'Ngữ pháp', kanji: '文法', color: '#1B2A4A' },
  { id: 'category=kanji', name: 'Hán tự', kanji: '漢字', color: '#C41E3A' },
  { id: 'category=conversation', name: 'Giao tiếp', kanji: '会話', color: '#D4A017' },
  { id: 'category=jlpt-prep', name: 'Luyện thi', kanji: '試験', color: '#E8432A' },
  { id: 'category=business-japanese', name: 'Thương mại', kanji: '商業', color: '#3B9979' },
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
    <Box ref={sectionRef} sx={{ py: { xs: 8, md: 12 }, bgcolor: '#FBF9F5', overflowX: 'hidden' }}>
      <Container disableGutters sx={{ maxWidth: { md: '1157px' }, px: { xs: 3, md: 0 }, margin: '0 auto' }}>

        {/* ══════════ SECTION 1: JLPT TIMELINE ══════════ */}
        <Box sx={{ mb: { xs: 8, md: 12 } }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: { xs: 'flex-start', md: 'flex-end' },
              justifyContent: 'space-between',
              gap: 3,
              mb: 5,
            }}
          >
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                <Box sx={{ width: 4, height: 20, bgcolor: '#C41E3A', borderRadius: 2, mr: 1.5 }} />
                <Typography variant="overline" sx={{ color: '#C41E3A', fontWeight: 700, letterSpacing: '0.08em', fontSize: '0.85rem' }}>
                  LỘ TRÌNH JLPT
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 800, color: '#1A1A2E', letterSpacing: '-0.02em', lineHeight: 1.3, fontSize: { xs: '2rem', md: '2.5rem' } }}>
                Chinh phục từng cấp độ
              </Typography>
            </Box>

            <Button
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate(ROUTES.PUBLIC.COURSE_BROWSE)}
              sx={{
                background: 'linear-gradient(135deg, #C41E3A, #E8432A)',
                py: 1.5,
                px: 3,
                fontWeight: 700,
                borderRadius: '10px',
                boxShadow: '0 4px 16px rgba(196, 30, 58, 0.25)',
                textTransform: 'uppercase',
                fontSize: '0.85rem',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, #A8182F, #D13A24)',
                  boxShadow: '0 8px 24px rgba(196,30,58,0.4)',
                  transform: 'translateY(-2px)',
                }
              }}
            >
              XEM TẤT CẢ
            </Button>
          </Box>

          {/* JLPT Timeline Row */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: 'stretch',
              gap: 0,
              position: 'relative',
            }}
          >
            {/* Connecting line (desktop) */}
            <Box
              sx={{
                display: { xs: 'none', md: 'block' },
                position: 'absolute',
                top: '50%',
                left: '5%',
                right: '5%',
                height: '2px',
                background: 'linear-gradient(to right, #5B8C5A, #3B9979, #D4A017, #E8432A, #C41E3A)',
                opacity: 0.2,
                zIndex: 0,
              }}
            />

            {JLPT_LEVELS.map((level, index) => (
              <Box
                key={level.id}
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  position: 'relative',
                  zIndex: 1,
                  px: 1,
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(40px)',
                  transition: `all 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.12}s`,
                }}
              >
                <Paper
                  elevation={0}
                  onClick={() => navigate(`${ROUTES.PUBLIC.COURSE_BROWSE}?${level.id}`)}
                  sx={{
                    p: 3,
                    width: '100%',
                    textAlign: 'center',
                    borderRadius: '16px',
                    border: '1.5px solid',
                    borderColor: '#e8e0d8',
                    bgcolor: '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      transform: 'translateY(-6px)',
                      boxShadow: `0 12px 30px ${level.color}22`,
                      borderColor: level.color,
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0, left: 0, right: 0,
                      height: '4px',
                      bgcolor: level.color,
                      borderRadius: '16px 16px 0 0',
                    }
                  }}
                >
                  {/* Kanji watermark */}
                  <Typography
                    sx={{
                      position: 'absolute',
                      bottom: -5, right: 5,
                      fontSize: '4rem',
                      fontWeight: 900,
                      color: `${level.color}08`,
                      lineHeight: 1,
                      userSelect: 'none',
                      pointerEvents: 'none',
                    }}
                  >
                    {level.subtitle}
                  </Typography>

                  <Typography sx={{ fontWeight: 900, fontSize: '1.8rem', color: level.color, mb: 0.5 }}>
                    {level.name}
                  </Typography>
                  <Typography sx={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600, mb: 0.5 }}>
                    {level.subtitle}
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>
                    {level.label}
                  </Typography>
                </Paper>

                {/* Arrow connector (desktop only, skip last) */}
                {index < JLPT_LEVELS.length - 1 && (
                  <Box
                    sx={{
                      display: { xs: 'none', md: 'block' },
                      position: 'absolute',
                      right: -12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      zIndex: 2,
                      color: '#C41E3A',
                      fontSize: '1.2rem',
                      opacity: 0.4,
                    }}
                  >
                    →
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        </Box>

        {/* ══════════ SECTION 2: SKILL CATEGORIES ══════════ */}
        <Box sx={{ mb: { xs: 8, md: 12 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
            <Box sx={{ width: 4, height: 20, bgcolor: '#D4A017', borderRadius: 2, mr: 1.5 }} />
            <Typography variant="overline" sx={{ color: '#D4A017', fontWeight: 700, letterSpacing: '0.08em', fontSize: '0.85rem' }}>
              KỸ NĂNG ỨNG DỤNG
            </Typography>
          </Box>
          <Typography variant="h3" sx={{ fontWeight: 800, color: '#1A1A2E', letterSpacing: '-0.02em', lineHeight: 1.3, mb: 4, fontSize: { xs: '2rem', md: '2.5rem' } }}>
            Luyện tập theo kỹ năng
          </Typography>

          <Grid container spacing={2.5}>
            {SKILL_CATEGORIES.map((category, index) => (
              <Grid key={category.id} size={{ xs: 6, sm: 4, md: 2 }}>
                <Paper
                  elevation={0}
                  onClick={() => navigate(`${ROUTES.PUBLIC.COURSE_BROWSE}?${category.id}`)}
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    borderRadius: '16px',
                    border: '1.5px solid #e8e0d8',
                    bgcolor: '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
                    transitionDelay: `${0.6 + index * 0.08}s`,
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      borderColor: category.color,
                      boxShadow: `0 8px 20px ${category.color}18`,
                    }
                  }}
                >
                  {/* Large Kanji as icon */}
                  <Typography
                    sx={{
                      fontSize: '2.5rem',
                      fontWeight: 800,
                      color: category.color,
                      mb: 1,
                      lineHeight: 1.2,
                      fontFamily: '"Noto Sans JP", "Noto Serif JP", serif',
                    }}
                  >
                    {category.kanji}
                  </Typography>
                  <Typography
                    sx={{
                      fontWeight: 700,
                      color: '#1A1A2E',
                      fontSize: '0.9rem',
                    }}
                  >
                    {category.name}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* ══════════ SECTION 3: INTRODUCTION BLOCK ══════════ */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 0 }}>

          {/* LEFT: Image */}
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
                borderRadius: 4,
              }}
            />
          </Box>

          {/* RIGHT: Content */}
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
              <Box sx={{ width: 4, height: 20, bgcolor: '#C41E3A', borderRadius: 2, mr: 1.5 }} />
              <Typography variant="overline" sx={{ color: '#C41E3A', fontWeight: 700, letterSpacing: '0.08em', fontSize: '0.85rem' }}>
                GIỚI THIỆU
              </Typography>
            </Box>

            <Typography variant="h2" sx={{ fontWeight: 800, color: '#1A1A2E', mb: 2.5, letterSpacing: '-0.02em', lineHeight: 1.2, fontSize: { xs: '2rem', md: '2.5rem', lg: '2.8rem' } }}>
              Chào Mừng Đến Với ManabiHub
            </Typography>

            <Typography variant="body1" sx={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.7, mb: 2 }}>
              Bạn muốn nâng cao kiến thức và kỹ năng của mình? Bạn muốn học những khóa học chất lượng<br />
              từ các giảng viên tiếng Nhật? Hãy khám phá các khóa học đang có trên ManabiHub.
            </Typography>

            <Typography variant="body1" sx={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.7, mb: 4 }}>
              Chúng tôi là một nền tảng học tiếng Nhật trực tuyến cung cấp một loạt các khóa học<br />
              đa dạng và chất lượng, từ JLPT N1-N5. Với đội ngũ giảng viên giàu kinh nghiệm và kiến thức<br />
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
                  borderRadius: 3,
                }}
              />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {[
                  'Tìm khóa học phù hợp với trình độ và mục tiêu',
                  'Học theo nội dung và lộ trình của từng khóa học',
                  'Tìm người hướng dẫn phù hợp cho bạn'
                ].map((item, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start' }}>
                    <CheckCircleIcon sx={{ color: '#C41E3A', mr: 1.5, fontSize: 18, mt: 0.3 }} />
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#1A1A2E', fontSize: '0.9rem' }}>
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
