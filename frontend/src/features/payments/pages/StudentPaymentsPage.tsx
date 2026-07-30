import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Pagination,
  Stack,
  Typography,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../shared/components/PageHeader/PageHeader';
import { ROUTES } from '../../../shared/constants/routes';
import type { OrderResponse } from '../../checkout/types';
import { useOrderHistory } from '../hooks/useOrderHistory';
import type { OrderStatus } from '../services/orderHistoryService';

interface FilterOption {
  label: string;
  status?: OrderStatus;
}

const FILTERS: FilterOption[] = [
  { label: 'Tất cả' },
  { label: 'Thành công', status: 'PAID' },
  { label: 'Đang xử lý', status: 'PENDING' },
  { label: 'Thất bại', status: 'FAILED' },
  { label: 'Đã hoàn tiền', status: 'REFUNDED' },
];

const STATUS_PRESENTATION: Record<
  OrderStatus,
  { label: string; background: string; color: string }
> = {
  PENDING: { label: 'Đang xử lý', background: '#FFF7E0', color: '#9A6700' },
  PAID: { label: 'Đã thanh toán', background: '#EAF8F0', color: '#24724A' },
  FAILED: { label: 'Thất bại', background: '#FDECEE', color: '#A71931' },
  REFUNDED: { label: 'Đã hoàn tiền', background: '#EAF3FF', color: '#245EA8' },
  CANCELLED: { label: 'Đã hủy', background: '#EEF1F4', color: '#596273' },
};

const DESKTOP_GRID = '1.35fr minmax(220px, 2.4fr) 1fr 1fr 1.2fr';

const headerCellSx = {
  color: '#667085',
  fontSize: '0.72rem',
  fontWeight: 800,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
};

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function StudentPaymentsPage() {
  const navigate = useNavigate();
  const [filterIndex, setFilterIndex] = useState(0);
  const [page, setPage] = useState(0);
  const selectedFilter = FILTERS[filterIndex];
  const { data, isLoading, isError, refetch, isFetching } = useOrderHistory({
    page,
    size: 10,
    status: selectedFilter.status,
  });

  const selectFilter = (index: number) => {
    setFilterIndex(index);
    setPage(0);
  };

  const orders = data?.content ?? [];

  return (
    <Box
      component="main"
      sx={{
        minHeight: '100%',
        bgcolor: '#FAF9F6',
        px: { xs: 2, sm: 3, lg: 4 },
        py: { xs: 3, md: 5 },
        overflow: 'hidden',
      }}
    >
      <Box sx={{ maxWidth: 1280, mx: 'auto', position: 'relative' }}>
        <Typography
          aria-hidden="true"
          sx={{
            position: 'absolute',
            top: -60,
            right: -25,
            color: 'rgba(27, 42, 74, 0.035)',
            fontSize: { xs: '8rem', md: '13rem' },
            fontWeight: 900,
            lineHeight: 1,
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          履歴
        </Typography>

        <Box sx={{ position: 'relative' }}>
          <PageHeader
            title="Lịch sử thanh toán"
            subtitle="購入履歴"
            breadcrumbs={[{ label: 'Học viên' }, { label: 'Lịch sử thanh toán' }]}
          />

          <Box
            sx={{
              border: '1px solid #E1E5EA',
              borderRadius: '8px',
              bgcolor: '#FFFFFF',
              boxShadow: '0 10px 28px rgba(15, 23, 42, 0.055)',
              overflow: 'hidden',
            }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              sx={{
                justifyContent: 'space-between',
                alignItems: { sm: 'center' },
                gap: 2,
                px: { xs: 2, md: 3 },
                py: 2.5,
                borderBottom: '1px solid #E8EBEF',
              }}
            >
              <Box>
                <Typography sx={{ color: '#172033', fontWeight: 900 }}>
                  Đơn hàng của bạn
                </Typography>
                <Typography variant="body2" sx={{ color: '#7A8391' }}>
                  Theo dõi giao dịch và mở lại khóa học đã thanh toán.
                </Typography>
              </Box>

              <Box
                role="group"
                aria-label="Lọc lịch sử thanh toán"
                sx={{
                  display: 'flex',
                  maxWidth: '100%',
                  gap: 0.5,
                  p: 0.5,
                  overflowX: 'auto',
                  bgcolor: '#F1F4F7',
                  borderRadius: '8px',
                }}
              >
                {FILTERS.map((filter, index) => {
                  const selected = filterIndex === index;
                  return (
                    <Button
                      key={filter.label}
                      aria-pressed={selected}
                      onClick={() => selectFilter(index)}
                      sx={{
                        minWidth: 'max-content',
                        px: 1.75,
                        py: 0.75,
                        color: selected ? '#C41E3A' : '#667085',
                        bgcolor: selected ? '#FFFFFF' : 'transparent',
                        borderRadius: '6px',
                        fontSize: '0.82rem',
                        fontWeight: selected ? 800 : 600,
                        boxShadow: selected ? '0 1px 4px rgba(15, 23, 42, 0.1)' : 'none',
                        '&:hover': { bgcolor: selected ? '#FFFFFF' : '#E8ECF1' },
                      }}
                    >
                      {filter.label}
                    </Button>
                  );
                })}
              </Box>
            </Stack>

            {isError ? (
              <Box sx={{ p: { xs: 2, md: 3 } }}>
                <Alert
                  severity="error"
                  action={
                    <Button color="inherit" size="small" onClick={() => refetch()}>
                      Thử lại
                    </Button>
                  }
                >
                  Không thể tải lịch sử thanh toán. Vui lòng thử lại.
                </Alert>
              </Box>
            ) : (
              <Box aria-busy={isLoading || isFetching}>
                <Box
                  sx={{
                    display: { xs: 'none', md: 'grid' },
                    gridTemplateColumns: DESKTOP_GRID,
                    gap: 2,
                    px: 3,
                    py: 1.75,
                    bgcolor: '#F8FAFC',
                    borderBottom: '1px solid #E8EBEF',
                  }}
                >
                  <Typography sx={headerCellSx}>Mã đơn hàng</Typography>
                  <Typography sx={headerCellSx}>Khóa học</Typography>
                  <Typography sx={headerCellSx}>Ngày tạo</Typography>
                  <Typography sx={{ ...headerCellSx, textAlign: 'right' }}>Số tiền</Typography>
                  <Typography sx={{ ...headerCellSx, textAlign: 'right' }}>Trạng thái</Typography>
                </Box>

                {isLoading ? (
                  <Box sx={{ minHeight: 300, display: 'grid', placeItems: 'center' }}>
                    <Stack spacing={2} sx={{ alignItems: 'center' }}>
                      <CircularProgress
                        aria-label="Đang tải lịch sử thanh toán"
                        sx={{ color: '#C41E3A' }}
                      />
                      <Typography color="text.secondary">Đang tải giao dịch...</Typography>
                    </Stack>
                  </Box>
                ) : orders.length === 0 ? (
                  <Box sx={{ minHeight: 330, display: 'grid', placeItems: 'center', p: 4 }}>
                    <Box sx={{ maxWidth: 440, textAlign: 'center' }}>
                      <ReceiptLongOutlinedIcon sx={{ fontSize: 58, color: '#A6AFBC', mb: 1.5 }} />
                      <Typography variant="h6" sx={{ color: '#172033', fontWeight: 900, mb: 1 }}>
                        Chưa có đơn hàng phù hợp
                      </Typography>
                      <Typography sx={{ color: '#667085', lineHeight: 1.6, mb: 3 }}>
                        Giao dịch mua khóa học sẽ xuất hiện tại đây ngay khi bạn bắt đầu thanh toán.
                      </Typography>
                      <Button
                        variant="contained"
                        onClick={() => navigate(ROUTES.STUDENT.BROWSE_COURSES)}
                        sx={{
                          bgcolor: '#C41E3A',
                          fontWeight: 800,
                          '&:hover': { bgcolor: '#A71931' },
                        }}
                      >
                        Khám phá khóa học
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  orders.map((order, index) => (
                    <OrderHistoryRow
                      key={order.id}
                      order={order}
                      showDivider={index < orders.length - 1}
                    />
                  ))
                )}
              </Box>
            )}

            {(data?.totalPages ?? 0) > 1 && !isError && (
              <Box
                sx={{
                  py: 2.5,
                  display: 'flex',
                  justifyContent: 'center',
                  borderTop: '1px solid #E8EBEF',
                }}
              >
                <Pagination
                  count={data?.totalPages ?? 1}
                  page={page + 1}
                  onChange={(_, value) => setPage(value - 1)}
                  sx={{
                    '& .Mui-selected': {
                      bgcolor: '#C41E3A !important',
                      color: '#FFFFFF',
                    },
                  }}
                />
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

function OrderHistoryRow({
  order,
  showDivider,
}: {
  order: OrderResponse;
  showDivider: boolean;
}) {
  const navigate = useNavigate();
  const status = STATUS_PRESENTATION[order.status];
  const course = order.items[0];
  const additionalCourses = Math.max(0, order.items.length - 1);

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'minmax(0, 1fr) auto', md: DESKTOP_GRID },
        gap: { xs: 1.5, md: 2 },
        alignItems: 'center',
        px: { xs: 2, md: 3 },
        py: { xs: 2.25, md: 2 },
        borderBottom: showDivider ? '1px solid #EEF0F3' : 'none',
        transition: 'background-color 160ms ease',
        '&:hover': { bgcolor: '#FCFCFD' },
      }}
    >
      <Box>
        <Typography variant="caption" sx={{ display: { md: 'none' }, color: '#7A8391' }}>
          Mã đơn hàng
        </Typography>
        <Typography variant="body2" sx={{ color: '#3D4654', fontWeight: 800 }}>
          {order.orderCode}
        </Typography>
      </Box>

      <Box
        sx={{
          minWidth: 0,
          gridColumn: { xs: '1 / -1', md: 'auto' },
          gridRow: { xs: 2, md: 'auto' },
        }}
      >
        <Typography variant="caption" sx={{ display: { md: 'none' }, color: '#7A8391' }}>
          Khóa học
        </Typography>
        <Typography variant="body2" sx={{ color: '#172033', fontWeight: 800 }} noWrap>
          {course?.courseTitle ?? 'Đơn hàng chưa có thông tin khóa học'}
        </Typography>
        {additionalCourses > 0 && (
          <Typography variant="caption" sx={{ color: '#7A8391' }}>
            và {additionalCourses} khóa học khác
          </Typography>
        )}
      </Box>

      <Box sx={{ gridRow: { xs: 3, md: 'auto' } }}>
        <Typography variant="caption" sx={{ display: { md: 'none' }, color: '#7A8391' }}>
          Ngày tạo
        </Typography>
        <Typography variant="body2" sx={{ color: '#596273' }}>
          {new Date(order.createdAt).toLocaleDateString('vi-VN')}
        </Typography>
      </Box>

      <Box sx={{ textAlign: { xs: 'right', md: 'right' }, gridRow: { xs: 3, md: 'auto' } }}>
        <Typography variant="caption" sx={{ display: { md: 'none' }, color: '#7A8391' }}>
          Số tiền
        </Typography>
        <Typography variant="body2" sx={{ color: '#172033', fontWeight: 900 }}>
          {formatMoney(order.totalAmount, order.currency)}
        </Typography>
      </Box>

      <Stack
        direction="row"
        sx={{
          gridColumn: { xs: '1 / -1', md: 'auto' },
          justifyContent: { xs: 'space-between', md: 'flex-end' },
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Chip
          label={status.label}
          size="small"
          sx={{
            bgcolor: status.background,
            color: status.color,
            borderRadius: '6px',
            fontWeight: 800,
          }}
        />
        {course && order.status === 'PAID' && (
          <Button
            size="small"
            endIcon={<ArrowForwardIcon />}
            onClick={() => navigate(ROUTES.STUDENT.COURSE_LEARN(course.courseId))}
            sx={{ color: '#C41E3A', fontWeight: 800 }}
          >
            Vào học
          </Button>
        )}
      </Stack>
    </Box>
  );
}
