import { Box, Typography, Button, Stack, Avatar, AvatarGroup, keyframes } from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Link } from 'react-router-dom';
import { getAsset } from '../../shared/utils/assets';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulseGlow = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.4); }
  70% { box-shadow: 0 0 0 15px rgba(37, 99, 235, 0); }
  100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
`;

const GoogleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

export function PublicLoginPage() {
  const handleGoogleLogin = () => {
    // Navigate to backend OAuth endpoint
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api';
    const baseUrl = apiBaseUrl.replace('/api', '');
    window.location.href = `${baseUrl}/oauth2/authorization/google`;
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#0f172a', fontFamily: '"Inter", "Roboto", sans-serif' }}>

      {/* Left Panel - Branding */}
      <Box
        sx={{
          display: { xs: 'none', lg: 'flex' },
          flex: 6,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""', position: 'absolute', inset: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            zIndex: 1
          }
        }}
      >
        <Box sx={{ position: 'absolute', inset: 0 }}>
          <img src={getAsset('hero.png')} alt="Japan Study" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </Box>

        <Box sx={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: 8, width: '100%' }}>
          <Box component={Link} to="/" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, textDecoration: 'none' }}>
            <Box sx={{ width: 40, height: 40, bgcolor: '#3b82f6', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.39)' }}>
              <MenuBookIcon sx={{ fontSize: 24, color: 'white' }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'white', letterSpacing: '-0.5px' }}>
              ManabiHub
            </Typography>
          </Box>

          <Box sx={{ maxWidth: 500, mb: 4, animation: `${fadeIn} 1s ease-out` }}>
            <Typography variant="h2" sx={{ fontWeight: 800, color: 'white', mb: 3, lineHeight: 1.1, fontSize: '3.5rem' }}>
              Hành trình chinh phục tiếng Nhật bắt đầu từ đây
            </Typography>
            <Typography variant="h6" sx={{ color: '#cbd5e1', mb: 4, fontWeight: 400, lineHeight: 1.6 }}>
              Học tập cùng các chuyên gia JLPT hàng đầu. Hơn 50,000+ học viên đã đạt được mục tiêu của mình cùng ManabiHub.
            </Typography>

            <Stack direction="row" sx={{ alignItems: 'center' }} spacing={2}>
              <AvatarGroup total={50000} sx={{ '& .MuiAvatar-root': { width: 48, height: 48, border: '2px solid', borderColor: 'grey.900' } }}>
                <Avatar alt="Student 1" src={getAsset('anh1.png')} />
                <Avatar alt="Student 2" src={getAsset('anh2.png')} />
                <Avatar alt="Student 3" src={getAsset('anh3.png')} />
                <Avatar alt="Student 4" src={getAsset('anh4.png')} />
              </AvatarGroup>
              <Typography variant="body2" sx={{ fontWeight: 500, color: 'white', lineHeight: 1.4 }}>
                Tham gia cộng đồng <br />
                <Typography component="span" sx={{ color: 'white', fontWeight: 700 }}>hơn 50k+ học viên</Typography>
              </Typography>
            </Stack>
          </Box>
        </Box>
      </Box>

      {/* Right Panel - Auth Action */}
      <Box
        sx={{
          flex: { xs: 1, lg: 4 },
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          p: { xs: 3, sm: 6, md: 8 },
          position: 'relative',
          bgcolor: '#ffffff',
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 400, animation: `${fadeIn} 0.6s ease-out` }}>
          {/* Mobile Header Logo */}
          <Box component={Link} to="/" sx={{ display: { xs: 'flex', lg: 'none' }, alignItems: 'center', justifyContent: 'center', gap: 1.5, mb: 6, textDecoration: 'none' }}>
            <Box sx={{ width: 40, height: 40, background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MenuBookIcon sx={{ fontSize: 24, color: 'white' }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>ManabiHub</Typography>
          </Box>

          <Box sx={{ textAlign: 'center', mb: 5 }}>
            <Box sx={{ width: 64, height: 64, margin: '0 auto 24px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: `${pulseGlow} 2s infinite` }}>
              <MenuBookIcon sx={{ fontSize: 32, color: '#2563eb' }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', mb: 1.5, letterSpacing: '-0.5px' }}>
              Chào mừng đến hệ thống 👋
            </Typography>
            <Typography variant="body1" sx={{ color: '#64748b', lineHeight: 1.6 }}>
              Để đảm bảo tính minh bạch cộng đồng và chất lượng người dùng, ManabiHub <Box component="span" sx={{ fontWeight: 600, color: '#334155' }}>chỉ hỗ trợ đăng ký và đăng nhập qua tài khoản Google</Box>.
            </Typography>
          </Box>

          {/* Primary Action */}
          <Button
            variant="outlined"
            fullWidth
            onClick={handleGoogleLogin}
            startIcon={<GoogleIcon />}
            sx={{
              py: 1.8,
              mb: 4,
              borderRadius: 3,
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '1rem',
              borderColor: '#cbd5e1',
              color: '#334155',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
              '&:hover': {
                bgcolor: '#f8fafc',
                borderColor: '#94a3b8',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
              },
              '&:active': {
                transform: 'translateY(0)',
              }
            }}
          >
            Tiếp tục với tài khoản Google
          </Button>

          {/* Info Notice */}
          <Box sx={{ p: 2, mb: 4, bgcolor: '#eff6ff', borderRadius: 3, border: '1px solid', borderColor: '#bfdbfe' }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
              <Box sx={{ mt: 0.25 }}>
                <InfoOutlinedIcon sx={{ color: '#2563eb', fontSize: 20 }} />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: '#0f172a', fontWeight: 700, mb: 0.5 }}>
                  Thông tin vai trò (Role)
                </Typography>
                <Typography variant="caption" sx={{ color: '#475569', lineHeight: 1.6, display: 'block' }}>
                  Mọi tài khoản đăng ký mới sẽ mặc định là <Box component="span" sx={{ fontWeight: 600, color: '#0f172a' }}>Học viên</Box>. Nếu muốn trở thành Giảng viên, bạn có thể thực hiện nâng cấp tài khoản (Nộp KYC & Bằng cấp) tại Trang chủ sau khi đăng nhập.
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* Admin Notice */}
          <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', textAlign: 'center', lineHeight: 1.6 }}>
            *Đối với Quản trị viên (Admin), vui lòng đăng nhập thông qua Cổng nội bộ (<Box component={Link} to="/admin/login" sx={{ color: '#64748b', textDecoration: 'underline', '&:hover': { color: '#2563eb' } }}>Admin Portal</Box>).
          </Typography>

        </Box>
      </Box>
    </Box>
  );
}
