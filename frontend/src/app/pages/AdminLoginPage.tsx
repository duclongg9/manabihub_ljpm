import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Alert, InputAdornment, IconButton, keyframes } from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useNavigate } from 'react-router-dom';
import { getAsset } from '../../shared/utils/assets';
import { axiosClient } from '../../shared/api/axiosClient';
import { ENDPOINTS } from '../../shared/api/endpoints';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulseGlow = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.4); }
  70% { box-shadow: 0 0 0 15px rgba(37, 99, 235, 0); }
  100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
`;

export function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const response = await axiosClient.post(ENDPOINTS.ADMIN_LOGIN, { email, password });
      const token = response.data?.data?.token;
      
      if (token) {
        localStorage.setItem('admin_token', token);
        navigate('/admin', { replace: true });
      } else {
        setErrorMsg('Không nhận được token từ máy chủ.');
      }
    } catch (error: any) {
      console.error('Admin login error:', error);
      if (!error.response) {
        setErrorMsg('Lỗi kết nối. Vui lòng kiểm tra lại mạng hoặc xem Backend đã chạy chưa.');
        setLoading(false);
        return;
      }
      const errorCode = error.response?.data?.errorCode;
      if (errorCode === 'MSG-AUTH-008') {
        setErrorMsg('Tài khoản quản trị đã bị tạm khóa do đăng nhập sai quá số lần cho phép.');
      } else {
        setErrorMsg('Tên đăng nhập hoặc mật khẩu quản trị không chính xác.');
      }
    } finally {
      setLoading(false);
    }
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
            background: 'rgba(0, 0, 0, 0.6)',
            zIndex: 1
          }
        }}
      >
        <Box sx={{ position: 'absolute', inset: 0 }}>
          <img src={getAsset('hero.png')} alt="Hero" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </Box>
        <Box sx={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: 8, width: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 40, height: 40, bgcolor: '#3b82f6', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.39)' }}>
              <MenuBookIcon sx={{ fontSize: 24, color: 'white' }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'white', letterSpacing: '-0.5px' }}>
              ManabiHub
            </Typography>
          </Box>
          <Box sx={{ maxWidth: 500, mb: 4, animation: `${fadeIn} 1s ease-out` }}>
            <Typography variant="h2" sx={{ fontWeight: 800, color: 'white', mb: 3, lineHeight: 1.1, fontSize: '3.5rem' }}>
              Admin Portal
            </Typography>
            <Typography variant="h6" sx={{ color: '#cbd5e1', fontWeight: 400, lineHeight: 1.6 }}>
              Hệ thống quản trị và vận hành nội bộ dành riêng cho Ban quản lý ManabiHub. Trải nghiệm bảo mật và an toàn tối đa.
            </Typography>
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
          <Box sx={{ display: { xs: 'flex', lg: 'none' }, alignItems: 'center', justifyContent: 'center', gap: 1.5, mb: 6 }}>
            <Box sx={{ width: 40, height: 40, background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MenuBookIcon sx={{ fontSize: 24, color: 'white' }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>ManabiHub</Typography>
          </Box>

          <Box sx={{ textAlign: 'center', mb: 5 }}>
            <Box sx={{ width: 64, height: 64, margin: '0 auto 24px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: `${pulseGlow} 2s infinite` }}>
              <AdminPanelSettingsIcon sx={{ fontSize: 32, color: '#2563eb' }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', mb: 1.5, letterSpacing: '-0.5px' }}>
              Chào mừng trở lại
            </Typography>
            <Typography variant="body1" sx={{ color: '#64748b' }}>
              Đăng nhập bằng tài khoản Internal Admin
            </Typography>
          </Box>

          {errorMsg && (
            <Alert 
              severity="error" 
              sx={{ mb: 4, borderRadius: 2, bgcolor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', '& .MuiAlert-icon': { color: '#dc2626' } }}
            >
              {errorMsg}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              placeholder="Email hoặc Tên đăng nhập"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              InputProps={{
                startAdornment: <InputAdornment position="start"><EmailOutlinedIcon sx={{ color: '#94a3b8' }} /></InputAdornment>,
                sx: { borderRadius: 3, bgcolor: '#f8fafc', '&:hover': { bgcolor: '#f1f5f9' }, '&.Mui-focused': { bgcolor: '#ffffff', boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.5)' } }
              }}
              sx={{ mb: 3 }}
            />
            
            <TextField
              fullWidth
              type={showPassword ? 'text' : 'password'}
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              InputProps={{
                startAdornment: <InputAdornment position="start"><LockOutlinedIcon sx={{ color: '#94a3b8' }} /></InputAdornment>,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" disabled={loading}>
                      {showPassword ? <VisibilityOff sx={{ color: '#94a3b8' }} /> : <Visibility sx={{ color: '#94a3b8' }} />}
                    </IconButton>
                  </InputAdornment>
                ),
                sx: { borderRadius: 3, bgcolor: '#f8fafc', '&:hover': { bgcolor: '#f1f5f9' }, '&.Mui-focused': { bgcolor: '#ffffff', boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.5)' } }
              }}
              sx={{ mb: 4 }}
            />
            
            <Button
              type="submit"
              fullWidth
              disabled={loading}
              sx={{
                py: 2, borderRadius: 3, textTransform: 'none', fontWeight: 700, fontSize: '1.1rem', color: 'white',
                background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.4)',
                transition: 'all 0.3s ease',
                '&:hover': { background: 'linear-gradient(135deg, #1d4ed8 0%, #4338ca 100%)', transform: 'translateY(-2px)', boxShadow: '0 15px 25px -5px rgba(37, 99, 235, 0.5)' },
                '&:disabled': { background: '#94a3b8', color: '#f1f5f9' }
              }}
            >
              {loading ? 'Đang xác thực...' : 'Đăng nhập hệ thống'}
            </Button>
          </form>
        </Box>
      </Box>
    </Box>
  );
}
