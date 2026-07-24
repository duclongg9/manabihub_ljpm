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
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../shared/constants/routes';

/* ─── JLPT Levels with vivid progression colors ─── */
const JLPT_LEVELS = [
  { id: 'jlptLevel=N5', name: 'N5', kanji: '初級', subtitle: '初級', color: '#4CAF50', gradient: 'linear-gradient(135deg, #4CAF50, #8BC34A)', label: 'Sơ cấp' },
  { id: 'jlptLevel=N4', name: 'N4', kanji: '初中級', subtitle: '初中級', color: '#8BC34A', gradient: 'linear-gradient(135deg, #8BC34A, #CDDC39)', label: 'Sơ-Trung cấp' },
  { id: 'jlptLevel=N3', name: 'N3', kanji: '中級', subtitle: '中級', color: '#C41E3A', gradient: 'linear-gradient(135deg, #C41E3A, #E8432A)', label: 'Trung cấp' },
  { id: 'jlptLevel=N2', name: 'N2', kanji: '上級', subtitle: '上級', color: '#F57C00', gradient: 'linear-gradient(135deg, #FF9800, #F57C00)', label: 'Cao cấp' },
  { id: 'jlptLevel=N1', name: 'N1', kanji: '最上級', subtitle: '最上級', color: '#D4A017', gradient: 'linear-gradient(135deg, #D4A017, #F3E5AB)', label: 'Thành thạo' },
];

/* ─── Skill Categories with unique color accents ─── */
const SKILL_CATEGORIES = [
  { id: 'category=vocabulary', name: 'Từ vựng', kanji: '語彙' },
  { id: 'category=grammar', name: 'Ngữ pháp', kanji: '文法' },
  { id: 'category=kanji', name: 'Hán tự', kanji: '漢字' },
  { id: 'category=conversation', name: 'Giao tiếp', kanji: '会話' },
  { id: 'category=jlpt-prep', name: 'Luyện thi', kanji: '試験' },
  { id: 'category=business-japanese', name: 'Thương mại', kanji: '商業' },
];

export const TopCategories: React.FC = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.08, rootMargin: '0px' }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <Box ref={sectionRef} sx={{ py: { xs: 8, md: 12 }, bgcolor: '#FBF9F5', overflowX: 'hidden' }}>
      <Container disableGutters sx={{ maxWidth: { md: '1157px' }, px: { xs: 3, md: 0 }, margin: '0 auto' }}>

        {/* ══════════ SECTION 1: JLPT PROGRESSION PATH ══════════ */}
        <Box sx={{ mb: { xs: 8, md: 12 } }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: { xs: 'flex-start', md: 'flex-end' },
              justifyContent: 'space-between',
              gap: 3, mb: 5,
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
              <Typography sx={{ color: '#64748b', mt: 1, fontSize: '1rem' }}>
                Lộ trình học tập từ cơ bản đến nâng cao — mỗi bước là một thành tựu mới
              </Typography>
            </Box>

            <Button
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate(ROUTES.PUBLIC.COURSE_BROWSE)}
              sx={{
                background: 'linear-gradient(135deg, #C41E3A, #E8432A)',
                py: 1.5, px: 3, fontWeight: 700,
                borderRadius: '10px',
                boxShadow: '0 4px 16px rgba(196, 30, 58, 0.25)',
                textTransform: 'uppercase', fontSize: '0.85rem',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, #A8182F, #D13A24)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 24px rgba(196,30,58,0.4)',
                }
              }}
            >
              XEM TẤT CẢ
            </Button>
          </Box>

          {/* JLPT Progression Path */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: { xs: 'stretch', md: 'stretch' },
              gap: { xs: 2, md: 0 },
              position: 'relative',
            }}
          >
            {/* Connecting gradient line (desktop) */}
            <Box
              sx={{
                display: { xs: 'none', md: 'block' },
                position: 'absolute',
                bottom: '32px', left: '8%', right: '8%',
                height: '4px',
                background: 'linear-gradient(to right, #4CAF50, #8BC34A, #FFB300, #F57C00, #E53935)',
                borderRadius: 4,
                opacity: isVisible ? 0.35 : 0,
                transition: 'opacity 1.5s ease 0.5s',
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
                  px: { xs: 0, md: 1.5 },
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.9)',
                  transition: `all 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.12}s`,
                }}
              >
                {/* No node dots here */}

                <Paper
                  elevation={0}
                  onClick={() => navigate(`${ROUTES.PUBLIC.COURSE_BROWSE}?${level.id}`)}
                  sx={{
                    p: { xs: 3, md: 4 },
                    width: '100%',
                    textAlign: 'center',
                    borderRadius: '20px',
                    border: '2px solid transparent',
                    bgcolor: '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    mb: { xs: 0, md: 8 },
                    '&:hover': {
                      transform: 'translateY(-8px) scale(1.02)',
                      boxShadow: `0 16px 40px ${level.color}20`,
                      borderColor: level.color,
                    },
                    // Top colored bar
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0, left: 0, right: 0,
                      height: '5px',
                      background: level.gradient,
                      borderRadius: '20px 20px 0 0',
                    }
                  }}
                >
                  {/* Large Kanji watermark */}
                  <Typography
                    sx={{
                      position: 'absolute',
                      top: '50%', left: '50%',
                      transform: 'translate(-50%, -50%)',
                      fontSize: { xs: '5.5rem', md: '6.5rem' },
                      fontWeight: 900,
                      fontFamily: '"Noto Sans JP", serif',
                      color: `${level.color}`,
                      opacity: 0.05,
                      lineHeight: 1,
                      userSelect: 'none',
                      pointerEvents: 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {level.subtitle}
                  </Typography>

                  {/* Kamon Badge */}
                  <Box sx={{
                    width: 48, height: 48, borderRadius: '50%',
                    bgcolor: `${level.color}15`, border: `2px solid ${level.color}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    mb: 2, position: 'relative', zIndex: 2, mx: 'auto',
                    boxShadow: `0 0 12px ${level.color}30`
                  }}>
                    <Typography sx={{ color: level.color, fontWeight: 800, fontSize: '0.9rem', fontFamily: '"Noto Sans JP", sans-serif' }}>
                      {level.kanji}
                    </Typography>
                  </Box>

                  {/* Level name with color */}
                  <Typography
                    sx={{
                      fontWeight: 900,
                      fontSize: '1.8rem',
                      background: level.gradient,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      mb: 0.5,
                      position: 'relative',
                      zIndex: 2,
                    }}
                  >
                    {level.name}
                  </Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {level.label}
                  </Typography>
                </Paper>
              </Box>
            ))}
          </Box>
        </Box>

        {/* ══════════ SECTION 2: SKILL CATEGORIES (Colorful) ══════════ */}
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
                    pt: 4,
                    textAlign: 'center',
                    borderRadius: '8px',
                    border: '1px solid #e8e0d8',
                    borderTop: '4px solid #C41E3A',
                    bgcolor: '#FFFDF9',
                    cursor: 'pointer',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
                    transitionDelay: `${0.6 + index * 0.1}s`,
                    '&:hover': {
                      transform: 'translateY(-6px)',
                      borderColor: 'rgba(196, 30, 58, 0.5)',
                      boxShadow: '0 12px 28px rgba(196, 30, 58, 0.15)',
                    },
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: '8px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      bgcolor: '#FBF9F5',
                      border: '1px solid #e8e0d8'
                    },
                    '&:hover .category-kanji': {
                      color: '#C41E3A',
                      transform: 'scale(1.1)',
                    }
                  }}
                >
                  {/* Large Kanji as icon */}
                  <Typography
                    className="category-kanji"
                    sx={{
                      fontSize: '2.8rem',
                      fontWeight: 800,
                      fontFamily: '"Noto Sans JP", serif',
                      color: '#1A1A2E',
                      mb: 1,
                      lineHeight: 1.1,
                      transition: 'all 0.3s ease',
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
        <Box sx={{ pb: 8 }}>
          <Box sx={{ width: '100%', opacity: isVisible ? 1 : 0, transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1) 0.2s', textAlign: 'center', mb: 6 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5 }}>
              <Box sx={{ width: 4, height: 20, bgcolor: '#C41E3A', borderRadius: 2, mr: 1.5 }} />
              <Typography variant="overline" sx={{ color: '#C41E3A', fontWeight: 700, letterSpacing: '0.08em', fontSize: '0.85rem' }}>
                TẠI SAO CHỌN CHÚNG TÔI
              </Typography>
            </Box>
            <Typography variant="h2" sx={{ fontWeight: 800, color: '#1A1A2E', mb: 2, letterSpacing: '-0.02em', lineHeight: 1.3, fontSize: { xs: '2rem', md: '2.5rem' } }}>
              Nền Tảng Tiếng Nhật Thế Hệ Mới
            </Typography>
          </Box>

          <Grid container spacing={4} sx={{ 
            opacity: isVisible ? 1 : 0, 
            transform: isVisible ? 'translateY(0)' : 'translateY(40px)', 
            transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1) 0.4s' 
          }}>
            {/* Card 1 */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper elevation={0} sx={{ p: 4, borderRadius: '24px', height: '100%', bgcolor: '#ffffff', border: '1px solid #f1f5f9', transition: 'all 0.3s', '&:hover': { transform: 'translateY(-8px)', boxShadow: '0 20px 40px rgba(0,0,0,0.04)', borderColor: '#e2e8f0' } }}>
                <Box sx={{ width: 64, height: 64, borderRadius: '20px', bgcolor: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
                  <Typography sx={{ fontSize: '2rem' }}>🎯</Typography>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#1A1A2E', mb: 2 }}>Lộ trình chuẩn JLPT</Typography>
                <Typography sx={{ color: '#64748b', lineHeight: 1.7 }}>Hệ thống bài giảng được thiết kế khoa học, đi từ cơ bản N5 đến nâng cao N1, được kiểm duyệt bởi các chuyên gia.</Typography>
              </Paper>
            </Grid>

            {/* Card 2 */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper elevation={0} sx={{ p: 4, borderRadius: '24px', height: '100%', bgcolor: '#ffffff', border: '1px solid #f1f5f9', transition: 'all 0.3s', '&:hover': { transform: 'translateY(-8px)', boxShadow: '0 20px 40px rgba(0,0,0,0.04)', borderColor: '#e2e8f0' } }}>
                <Box sx={{ width: 64, height: 64, borderRadius: '20px', bgcolor: '#E0E7FF', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
                  <Typography sx={{ fontSize: '2rem' }}>🤖</Typography>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#1A1A2E', mb: 2 }}>AI Sensei 24/7</Typography>
                <Typography sx={{ color: '#64748b', lineHeight: 1.7 }}>Công nghệ trợ lý ảo thông minh giúp giải đáp ngữ pháp, từ vựng và chữa bài ngay lập tức, học không giới hạn.</Typography>
              </Paper>
            </Grid>

            {/* Card 3 */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper elevation={0} sx={{ p: 4, borderRadius: '24px', height: '100%', bgcolor: '#ffffff', border: '1px solid #f1f5f9', transition: 'all 0.3s', '&:hover': { transform: 'translateY(-8px)', boxShadow: '0 20px 40px rgba(0,0,0,0.04)', borderColor: '#e2e8f0' } }}>
                <Box sx={{ width: 64, height: 64, borderRadius: '20px', bgcolor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
                  <Typography sx={{ fontSize: '2rem' }}>📜</Typography>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#1A1A2E', mb: 2 }}>Thực hành & Feedback</Typography>
                <Typography sx={{ color: '#64748b', lineHeight: 1.7 }}>Hệ thống bài tập phong phú, flashcard thông minh và bài viết luận được đánh giá chi tiết bởi giáo viên thật.</Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};
