import React, { useState } from 'react';
import { Box, Card, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Button } from '@mui/material';
import { PageHeader } from '../../../shared/components/PageHeader/PageHeader';
import { useNavigate } from 'react-router-dom';

// Dummy data for transactions (can be fetched from API later)
const DUMMY_TRANSACTIONS: any[] = [];

export const StudentPaymentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);

  return (
    <Box component="main" sx={{ minHeight: '100vh', bgcolor: '#FAF9F6', py: { xs: 3, md: 5 }, px: { xs: 2, sm: 3 } }}>
      <Box sx={{ maxWidth: '1280px', mx: 'auto', width: '100%', position: 'relative' }}>
        {/* Background Watermark */}
        <Typography variant="h1" sx={{ position: 'absolute', top: -40, right: -20, fontSize: '15rem', fontWeight: 900, color: 'rgba(0,0,0,0.025)', userSelect: 'none', pointerEvents: 'none', zIndex: 0, writingMode: 'vertical-rl' }}>
          履歴
        </Typography>
        <PageHeader
          title="Lịch sử thanh toán"
          subtitle="購入履歴"
          breadcrumbs={[
            { label: 'Học viên' },
            { label: 'Lịch sử thanh toán' },
          ]}
        />

        <Card elevation={0} sx={{ position: 'relative', zIndex: 1, borderRadius: 4, border: "1px solid", borderColor: 'divider', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', bgcolor: '#FFFFFF', overflow: 'hidden' }}>
          
          <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
            {/* Segmented Control Tabs */}
            <Box sx={{ display: 'inline-flex', bgcolor: '#f1f5f9', p: 0.5, borderRadius: 3, gap: 0.5 }}>
              {['Tất cả', 'Thành công', 'Đang xử lý', 'Đã hủy'].map((label, index) => {
                const isSelected = tabValue === index;
                return (
                  <Button
                    key={index}
                    onClick={() => setTabValue(index)}
                    disableElevation
                    sx={{
                      textTransform: 'none',
                      fontWeight: isSelected ? 600 : 500,
                      color: isSelected ? '#C41E3A' : 'text.secondary',
                      bgcolor: isSelected ? '#FFFFFF' : 'transparent',
                      borderRadius: 2.5,
                      px: 3,
                      py: 0.75,
                      boxShadow: isSelected ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      '&:hover': {
                        bgcolor: isSelected ? '#FFFFFF' : 'rgba(0,0,0,0.04)'
                      }
                    }}
                  >
                    {label}
                  </Button>
                );
              })}
            </Box>
          </Box>

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
                {DUMMY_TRANSACTIONS.length > 0 ? (
                  DUMMY_TRANSACTIONS.map((row) => (
                    <TableRow key={row.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell sx={{ fontWeight: 700 }}>{row.id}</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: 'grey.900' }}>{row.courseName}</TableCell>
                      <TableCell>{row.date}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{row.amount}</TableCell>
                      <TableCell>
                        <Chip size="small" label={row.status} sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 700 }} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ borderBottom: 0 }}>
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
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Box>
    </Box>
  );
};
