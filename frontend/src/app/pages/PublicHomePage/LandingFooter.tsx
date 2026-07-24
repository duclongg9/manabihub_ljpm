import React from 'react';
import { Box, Container, Grid, Typography, Stack, Divider, IconButton } from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../shared/constants/routes';

const FooterLink: React.FC<{ to: string; children: React.ReactNode; disabled?: boolean }> = ({ to, children, disabled }) => (
  <Typography
    variant="body2"
    component={disabled ? 'span' : Link}
    to={disabled ? undefined : to}
    sx={{
      color: disabled ? '#4a5568' : '#94a3b8',
      textDecoration: 'none',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 0.5,
      transition: 'all 0.3s ease',
      position: 'relative',
      cursor: disabled ? 'default' : 'pointer',
      '&::after': disabled ? {} : {
        content: '""',
        position: 'absolute',
        width: '0',
        height: '1px',
        bottom: '-2px',
        left: 0,
        backgroundColor: '#C41E3A',
        transition: 'width 0.3s ease',
      },
      '&:hover': disabled ? {} : {
        color: '#ffffff',
        transform: 'translateX(4px)',
        '&::after': {
          width: '100%',
        }
      }
    }}
  >
    {children}
    {disabled && (
      <Box
        component="span"
        sx={{
          fontSize: '0.65rem',
          bgcolor: 'rgba(196, 30, 58, 0.15)',
          color: '#C41E3A',
          px: 0.8, py: 0.2,
          borderRadius: '4px',
          fontWeight: 600,
          ml: 0.5,
        }}
      >
        Sắp ra mắt
      </Box>
    )}
  </Typography>
);

export const LandingFooter: React.FC = () => {
  return (
    <Box sx={{ bgcolor: '#0A1628', pt: { xs: 10, md: 14 }, pb: 6, borderTop: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
      {/* Background Glow Effects */}
      <Box sx={{ position: 'absolute', top: '-20%', left: '-10%', width: '40%', height: '50%', background: 'radial-gradient(circle, rgba(196,30,58,0.06) 0%, rgba(0,0,0,0) 70%)', zIndex: 0 }} />
      <Box sx={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '30%', height: '50%', background: 'radial-gradient(circle, rgba(91,140,90,0.04) 0%, rgba(0,0,0,0) 70%)', zIndex: 0 }} />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Grid container spacing={8} sx={{ mb: 10 }}>
          {/* Logo & Description */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Box
                sx={{
                  width: 40, height: 40,
                  background: 'linear-gradient(135deg, #C41E3A 0%, #E8432A 100%)',
                  borderRadius: 2,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 15px rgba(196, 30, 58, 0.3)'
                }}
              >
                <MenuBookIcon sx={{ fontSize: 24, color: 'white' }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#ffffff', letterSpacing: '-0.5px' }}>
                ManabiHub
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ color: '#94a3b8', lineHeight: 1.8, pr: { md: 4 }, mb: 4, fontWeight: 300 }}>
              Nền tảng học tiếng Nhật trực tuyến hàng đầu, kết nối học viên và những chuyên gia xuất sắc nhất. Chinh phục JLPT dễ dàng hơn bao giờ hết.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              {[<FacebookIcon key="fb" />, <TwitterIcon key="tw" />, <LinkedInIcon key="in" />].map((icon, index) => (
                <IconButton
                  key={index}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.05)',
                    color: '#cbd5e1',
                    border: '1px solid rgba(255,255,255,0.1)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      bgcolor: '#C41E3A',
                      color: '#ffffff',
                      transform: 'translateY(-4px)',
                      boxShadow: '0 10px 20px rgba(196, 30, 58, 0.3)'
                    }
                  }}
                >
                  {icon}
                </IconButton>
              ))}
            </Box>
          </Grid>

          {/* Links Column 1 */}
          <Grid size={{ xs: 12, sm: 4, md: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#ffffff', mb: 3, letterSpacing: '0.5px', textTransform: 'uppercase', fontSize: '0.85rem' }}>
              ManabiHub
            </Typography>
            <Stack spacing={2}>
              <FooterLink to={ROUTES.PUBLIC.ABOUT}>Về chúng tôi</FooterLink>
              <FooterLink to={ROUTES.PUBLIC.ABOUT}>Liên hệ</FooterLink>
              <FooterLink to={ROUTES.PUBLIC.COURSE_BROWSE}>Khám phá khóa học</FooterLink>
            </Stack>
          </Grid>

          {/* Links Column 2 */}
          <Grid size={{ xs: 12, sm: 4, md: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#ffffff', mb: 3, letterSpacing: '0.5px', textTransform: 'uppercase', fontSize: '0.85rem' }}>
              Hỗ Trợ
            </Typography>
            <Stack spacing={2}>
              <FooterLink to="#" disabled>Điều khoản sử dụng</FooterLink>
              <FooterLink to="#" disabled>Chính sách bảo mật</FooterLink>
              <FooterLink to="#" disabled>Câu hỏi thường gặp</FooterLink>
            </Stack>
          </Grid>

          {/* Links Column 3 */}
          <Grid size={{ xs: 12, sm: 4, md: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#ffffff', mb: 3, letterSpacing: '0.5px', textTransform: 'uppercase', fontSize: '0.85rem' }}>
              Giảng Dạy
            </Typography>
            <Stack spacing={2}>
              <FooterLink to={ROUTES.TEACHER.KYC}>Trở thành giảng viên</FooterLink>
              <FooterLink to="#" disabled>Quy định giảng viên</FooterLink>
              <FooterLink to={ROUTES.TEACHER.KYC}>Chia sẻ doanh thu (lên đến 97%)</FooterLink>
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ mb: 4, borderColor: 'rgba(255,255,255,0.08)' }} />

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" sx={{ color: '#4a5568', fontWeight: 300 }}>
            © {new Date().getFullYear()} ManabiHub. All rights reserved.
          </Typography>
          <Box sx={{ display: 'flex', gap: 3 }}>
            {['Privacy', 'Terms', 'Sitemap'].map((text) => (
              <Typography
                key={text}
                variant="body2"
                component="span"
                sx={{
                  color: '#4a5568',
                  cursor: 'default',
                  fontSize: '0.85rem',
                }}
              >
                {text}
              </Typography>
            ))}
          </Box>
        </Box>
      </Container>
    </Box>
  );
};
