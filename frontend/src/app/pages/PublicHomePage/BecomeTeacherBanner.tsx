import React from 'react';
import { Box, Container, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../shared/constants/routes';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';

export const BecomeTeacherBanner: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ bgcolor: '#0f172a', py: { xs: 8, md: 12 }, textAlign: 'center' }}>
      <Container maxWidth="md">
        <Typography variant="h3" sx={{ fontWeight: 800, color: '#ffffff', mb: 3, fontSize: { xs: '2rem', md: '2.5rem' } }}>
          Trở thành Giảng viên ManabiHub
        </Typography>

        <Typography variant="h6" sx={{ color: '#cbd5e1', fontWeight: 400, mb: 1, lineHeight: 1.6, px: { md: 4 } }}>
          Chia sẻ kiến thức của bạn và tạo thu nhập thụ động. Nền tảng chia sẻ lợi nhuận hấp dẫn lên đến 40% cho mỗi khóa học được bán ra.
        </Typography>
        <Typography variant="body1" sx={{ color: '#94a3b8', fontStyle: 'italic', mb: 5 }}>
          * Tất cả giảng viên đều phải vượt qua quy trình kiểm duyệt hồ sơ (KYC) khắt khe trước khi xuất bản khóa học để đảm bảo uy tín.
        </Typography>

        <Button
          variant="contained"
          size="large"
          onClick={() => navigate(ROUTES.TEACHER.KYC)}
          startIcon={<WorkspacePremiumIcon />}
          sx={{
            py: 1.5, px: 5, borderRadius: 2,
            bgcolor: '#2563eb', color: 'white',
            fontWeight: 700, textTransform: 'none', fontSize: '1.1rem',
            '&:hover': { bgcolor: '#1d4ed8' }
          }}
        >
          Bắt đầu giảng dạy ngay
        </Button>
      </Container>
    </Box>
  );
};
