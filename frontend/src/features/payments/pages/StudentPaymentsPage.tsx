import React, { useState } from 'react';
import { Box, Card, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Button, Tabs, Tab } from '@mui/material';
import { PageHeader } from '../../../shared/components/PageHeader/PageHeader';
import { useNavigate } from 'react-router-dom';

// Dummy data for transactions (can be fetched from API later)
const DUMMY_TRANSACTIONS: any[] = [];

export const StudentPaymentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box component="main" sx={{ minHeight: '100vh', bgcolor: '#FAF9F6', py: { xs: 3, md: 5 }, px: { xs: 2, sm: 3 } }}>
      <Box sx={{ maxWidth: '1280px', mx: 'auto', width: '100%', position: 'relative' }}>
        <PageHeader
          title="Lịch sử thanh toán"
          subtitle="購入履歴"
          watermark="履歴"
          breadcrumbs={[
            { label: 'Học viên' },
            { label: 'Thanh toán' },
          ]}
        />

        <Card elevation={0} sx={{ borderRadius: 4, border: "1px solid", borderColor: 'divider', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', bgcolor: '#FFFFFF', overflow: 'hidden' }}>
          
          <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              aria-label="payment history tabs"
              sx={{ 
                px: 2,
                '& .MuiTabs-indicator': { backgroundColor: '#C41E3A' },
                '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.9rem', color: 'text.secondary', minWidth: 'auto', mr: 4 },
                '& .Mui-selected': { color: '#C41E3A !important' }
              }}
            >
              <Tab label="Tất cả" />
              <Tab label="Thành công" />
              <Tab label="Đang xử lý" />
              <Tab label="Đã hủy" />
            </Tabs>
          </Box>

          {DUMMY_TRANSACTIONS.length > 0 ? (
            <TableContainer>
              <Table sx={{ minWidth: 650 }}>
                <TableHead sx={{ bgcolor: 'grey.50' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.75rem' }}>Mã đơn hàng</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.75rem' }}>Khóa học</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.75rem' }}>Ngày thanh toán</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.75rem' }}>Số tiền</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.75rem' }}>Trạng thái</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {DUMMY_TRANSACTIONS.map((row) => (
                    <TableRow key={row.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell sx={{ fontWeight: 700 }}>{row.id}</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: 'grey.900' }}>{row.courseName}</TableCell>
                      <TableCell>{row.date}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{row.amount}</TableCell>
                      <TableCell>
                        <Chip size="small" label={row.status} sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 700 }} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ textAlign: 'center', py: 10, px: 3 }}>
              <Box sx={{ fontSize: '6rem', mb: 2, filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.1))', transform: 'rotate(-5deg)', opacity: 0.8 }}>🐕</Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'grey.900', mb: 1 }}>
                Bạn chưa có giao dịch nào
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
                Lịch sử thanh toán sẽ hiển thị tại đây khi bạn đăng ký khóa học.
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', color: 'text.disabled', mb: 4, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 }}>
                まだ購入履歴はありません
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate('/student/browse')}
                sx={{
                  borderRadius: 8, px: 4, py: 1.5, textTransform: 'none', fontWeight: 700, fontSize: '1rem',
                  bgcolor: '#C41E3A', '&:hover': { bgcolor: '#a01830' }, boxShadow: '0 4px 14px 0 rgba(196,30,58,0.39)'
                }}
              >
                Khám phá khóa học ngay
              </Button>
            </Box>
          )}
        </Card>
      </Box>
    </Box>
  );
};
