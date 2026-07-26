import React, { useState } from 'react';
import { Box, Typography, Chip, Button } from '@mui/material';
import { PageHeader } from '../../../shared/components/PageHeader/PageHeader';
import { useNavigate } from 'react-router-dom';

// Dummy data for transactions (can be fetched from API later)
const DUMMY_TRANSACTIONS: any[] = [];

// Filter tab labels
const FILTER_TABS = ['Tất cả', 'Thành công', 'Đang xử lý', 'Đã hủy'];

// Column definitions using CSS Grid 12-column system
const GRID_TEMPLATE = '2fr 4fr 2fr 2fr 2fr'; // 5 columns matching 12-col ratio

// Header cell style
const headerCellSx = {
  fontWeight: 600,
  color: 'text.secondary',
  textTransform: 'uppercase',
  fontSize: '0.7rem',
  letterSpacing: '0.05em',
};

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

        {/* ═══════ Main Card Container ═══════ */}
        <Box sx={{
          position: 'relative',
          zIndex: 1,
          borderRadius: 4,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.02)',
          bgcolor: '#FFFFFF',
          p: { xs: 2, md: 3 },
          display: 'flex',
          flexDirection: 'column',
          gap: 3
        }}>

          {/* ── Toolbar: Segmented Filter Pills ── */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
            <Box sx={{ display: 'inline-flex', bgcolor: '#f1f5f9', p: 0.5, borderRadius: 3, gap: 0.5 }}>
              {FILTER_TABS.map((label, index) => {
                const isSelected = tabValue === index;
                return (
                  <Button
                    key={index}
                    onClick={() => setTabValue(index)}
                    disableElevation
                    disableRipple={false}
                    sx={{
                      textTransform: 'none',
                      fontWeight: isSelected ? 600 : 500,
                      fontSize: '0.85rem',
                      color: isSelected ? '#C41E3A' : 'text.secondary',
                      bgcolor: isSelected ? '#FFFFFF' : 'transparent',
                      borderRadius: 2.5,
                      px: 2.5,
                      py: 0.75,
                      minWidth: 'auto',
                      boxShadow: isSelected ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: isSelected ? '#FFFFFF' : 'rgba(0,0,0,0.04)',
                      },
                    }}
                  >
                    {label}
                  </Button>
                );
              })}
            </Box>
          </Box>

          {/* ── Bordered Table Container ── */}
          <Box sx={{
             border: '1px solid',
             borderColor: 'divider',
             borderRadius: 3,
             overflow: 'hidden'
          }}>
            {/* ── Column Headers (CSS Grid) ── */}
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: GRID_TEMPLATE,
              gap: 2,
              px: { xs: 2, md: 3 },
              py: 2,
              bgcolor: '#f8fafc',
              borderBottom: '1px solid',
              borderColor: 'divider',
              alignItems: 'center',
            }}>
              <Typography sx={headerCellSx}>Mã đơn hàng</Typography>
              <Typography sx={headerCellSx}>Khóa học</Typography>
              <Typography sx={headerCellSx}>Ngày thanh toán</Typography>
              <Typography sx={{ ...headerCellSx, textAlign: 'right' }}>Số tiền</Typography>
              <Typography sx={{ ...headerCellSx, textAlign: 'center' }}>Trạng thái</Typography>
            </Box>

            {/* ── Data Rows / Empty State ── */}
            {DUMMY_TRANSACTIONS.length > 0 ? (
              DUMMY_TRANSACTIONS.map((row, idx) => (
                <Box
                  key={row.id}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: GRID_TEMPLATE,
                    gap: 2,
                    px: { xs: 2, md: 3 },
                    py: 2,
                    alignItems: 'center',
                    borderBottom: idx < DUMMY_TRANSACTIONS.length - 1 ? '1px solid' : 'none',
                    borderColor: 'divider',
                    transition: 'background-color 0.15s',
                    '&:hover': { bgcolor: '#fafafa' },
                  }}
                >
                  <Typography sx={{ fontWeight: 700, fontSize: '0.875rem', color: 'grey.700' }}>
                    {row.id}
                  </Typography>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: 'grey.900', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {row.courseName}
                  </Typography>
                  <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                    {row.date}
                  </Typography>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', textAlign: 'right' }}>
                    {row.amount}
                  </Typography>
                  <Box sx={{ textAlign: 'center' }}>
                    <Chip
                      size="small"
                      label={row.status}
                      sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 700, fontSize: '0.75rem' }}
                    />
                  </Box>
                </Box>
              ))
            ) : (
              /* ── Empty State ── */
              <Box sx={{ textAlign: 'center', py: { xs: 8, md: 10 }, px: 3, bgcolor: '#FFFFFF' }}>
                <Box sx={{ fontSize: '5rem', mb: 2, filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.08))', transform: 'rotate(-5deg)', opacity: 0.85, display: 'inline-block' }}>
                  🐕
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'grey.900', mb: 1 }}>
                  Bạn chưa có giao dịch nào
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3, maxWidth: 400, mx: 'auto' }}>
                  Lịch sử thanh toán sẽ hiển thị tại đây khi bạn đăng ký khóa học.
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => navigate('/student/browse')}
                  sx={{
                    borderRadius: 3,
                    px: 4,
                    py: 1.5,
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    bgcolor: '#C41E3A',
                    '&:hover': { bgcolor: '#a01830' },
                    boxShadow: '0 4px 14px 0 rgba(196,30,58,0.39)',
                  }}
                >
                  Khám phá khóa học ngay
                </Button>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
