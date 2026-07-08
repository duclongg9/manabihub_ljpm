import React from 'react';
import { Box, Container, Grid, Typography, Stack, Divider } from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { Link } from 'react-router-dom';

export const LandingFooter: React.FC = () => {
  return (
    <Box sx={{ bgcolor: '#ffffff', pt: 8, pb: 4, borderTop: '1px solid #f1f5f9' }}>
      <Container maxWidth="lg">
        <Grid container spacing={4} sx={{ mb: 6 }}>
          {/* Logo & Description */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Box sx={{ width: 32, height: 32, bgcolor: '#3b82f6', borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MenuBookIcon sx={{ fontSize: 20, color: 'white' }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
                ManabiHub
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: '#64748b', lineHeight: 1.6, pr: { md: 4 } }}>
              Nền tảng học tiếng Nhật trực tuyến hàng đầu, kết nối học viên và những giảng viên xuất sắc nhất.
            </Typography>
          </Grid>

          {/* Links Column 1 */}
          <Grid size={{ xs: 12, sm: 4, md: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', mb: 2 }}>
              ManabiHub
            </Typography>
            <Stack spacing={1.5}>
              <Typography variant="body2" component={Link} to="#" sx={{ color: '#64748b', textDecoration: 'none', '&:hover': { color: '#3b82f6' } }}>Về chúng tôi</Typography>
              <Typography variant="body2" component={Link} to="#" sx={{ color: '#64748b', textDecoration: 'none', '&:hover': { color: '#3b82f6' } }}>Liên hệ</Typography>
              <Typography variant="body2" component={Link} to="#" sx={{ color: '#64748b', textDecoration: 'none', '&:hover': { color: '#3b82f6' } }}>Tuyển dụng</Typography>
            </Stack>
          </Grid>

          {/* Links Column 2 */}
          <Grid size={{ xs: 12, sm: 4, md: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', mb: 2 }}>
              Hỗ trợ
            </Typography>
            <Stack spacing={1.5}>
              <Typography variant="body2" component={Link} to="#" sx={{ color: '#64748b', textDecoration: 'none', '&:hover': { color: '#3b82f6' } }}>Điều khoản sử dụng</Typography>
              <Typography variant="body2" component={Link} to="#" sx={{ color: '#64748b', textDecoration: 'none', '&:hover': { color: '#3b82f6' } }}>Chính sách bảo mật</Typography>
              <Typography variant="body2" component={Link} to="#" sx={{ color: '#64748b', textDecoration: 'none', '&:hover': { color: '#3b82f6' } }}>Câu hỏi thường gặp</Typography>
            </Stack>
          </Grid>

          {/* Links Column 3 */}
          <Grid size={{ xs: 12, sm: 4, md: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', mb: 2 }}>
              Giảng dạy
            </Typography>
            <Stack spacing={1.5}>
              <Typography variant="body2" component={Link} to="/teacher/kyc" sx={{ color: '#64748b', textDecoration: 'none', '&:hover': { color: '#3b82f6' } }}>Trở thành giảng viên</Typography>
              <Typography variant="body2" component={Link} to="#" sx={{ color: '#64748b', textDecoration: 'none', '&:hover': { color: '#3b82f6' } }}>Quy định giảng viên</Typography>
              <Typography variant="body2" component={Link} to="#" sx={{ color: '#64748b', textDecoration: 'none', '&:hover': { color: '#3b82f6' } }}>Chính sách chia sẻ doanh thu</Typography>
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ mb: 3 }} />
        
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" sx={{ color: '#94a3b8' }}>
            © {new Date().getFullYear()} ManabiHub. All rights reserved.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ width: 32, height: 32, bgcolor: '#f1f5f9', borderRadius: '50%' }} />
            <Box sx={{ width: 32, height: 32, bgcolor: '#f1f5f9', borderRadius: '50%' }} />
            <Box sx={{ width: 32, height: 32, bgcolor: '#f1f5f9', borderRadius: '50%' }} />
          </Box>
        </Box>
      </Container>
    </Box>
  );
};
