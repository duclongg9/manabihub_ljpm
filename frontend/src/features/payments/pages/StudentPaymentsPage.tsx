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

const STATUS_PRESENTATION: Record<OrderStatus, { label: string; color: 'default' | 'success' | 'warning' | 'error' | 'info' }> = {
  PENDING: { label: 'Đang xử lý', color: 'warning' },
  PAID: { label: 'Đã thanh toán', color: 'success' },
  FAILED: { label: 'Thất bại', color: 'error' },
  REFUNDED: { label: 'Đã hoàn tiền', color: 'info' },
  CANCELLED: { label: 'Đã hủy', color: 'default' },
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
  const { data, isLoading, isError, error, refetch, isFetching } = useOrderHistory({
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
    <Box component="main" sx={{ minHeight: '100%', bgcolor: 'background.default', p: { xs: 2, md: 4 } }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        <PageHeader
          title="Lịch sử thanh toán"
          subtitle="Theo dõi các đơn mua khóa học và trạng thái thanh toán."
          breadcrumbs={[{ label: 'Học viên' }, { label: 'Lịch sử thanh toán' }]}
        />

        <Stack
          direction="row"
          sx={{ gap: 1, mb: 3, overflowX: 'auto', pb: 0.5 }}
          aria-label="Lọc lịch sử thanh toán"
        >
          {FILTERS.map((filter, index) => (
            <Button
              key={filter.label}
              variant={filterIndex === index ? 'contained' : 'outlined'}
              size="small"
              onClick={() => selectFilter(index)}
              sx={{ flexShrink: 0, textTransform: 'none' }}
            >
              {filter.label}
            </Button>
          ))}
        </Stack>

        {isError && (
          <Alert
            severity="error"
            sx={{ mb: 3 }}
            action={<Button color="inherit" size="small" onClick={() => refetch()}>Thử lại</Button>}
          >
            Không thể tải lịch sử thanh toán: {(error as Error).message}
          </Alert>
        )}

        {isLoading ? (
          <Box sx={{ minHeight: 280, display: 'grid', placeItems: 'center' }}>
            <CircularProgress aria-label="Đang tải lịch sử thanh toán" />
          </Box>
        ) : orders.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, borderTop: '1px solid', borderColor: 'divider' }}>
            <ReceiptLongOutlinedIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              Chưa có đơn hàng phù hợp
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Các đơn mua khóa học sẽ được lưu tại đây sau khi bạn bắt đầu thanh toán.
            </Typography>
            <Button variant="contained" onClick={() => navigate(ROUTES.STUDENT.BROWSE_COURSES)}>
              Khám phá khóa học
            </Button>
          </Box>
        ) : (
          <Stack spacing={1.5} aria-busy={isFetching}>
            {orders.map((order) => (
              <OrderHistoryRow key={order.id} order={order} />
            ))}
          </Stack>
        )}

        {(data?.totalPages ?? 0) > 1 && (
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
            <Pagination
              count={data?.totalPages ?? 1}
              page={page + 1}
              onChange={(_, value) => setPage(value - 1)}
              color="primary"
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}

function OrderHistoryRow({ order }: { order: OrderResponse }) {
  const navigate = useNavigate();
  const status = STATUS_PRESENTATION[order.status];
  const course = order.items[0];
  const additionalCourses = Math.max(0, order.items.length - 1);

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1.4fr 2.4fr 1fr 1fr auto' },
        gap: { xs: 1, md: 2 },
        alignItems: { xs: 'start', md: 'center' },
        p: 2,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        bgcolor: 'background.paper',
      }}
    >
      <Box>
        <Typography variant="caption" color="text.secondary">Mã đơn hàng</Typography>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>{order.orderCode}</Typography>
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary">Khóa học</Typography>
        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
          {course?.courseTitle ?? 'Đơn hàng chưa có thông tin khóa học'}
          {additionalCourses > 0 ? ` và ${additionalCourses} khóa học khác` : ''}
        </Typography>
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary">Ngày tạo</Typography>
        <Typography variant="body2">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</Typography>
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary">Số tiền</Typography>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {formatMoney(order.totalAmount, order.currency)}
        </Typography>
      </Box>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1, justifyContent: { md: 'flex-end' } }}>
        <Chip label={status.label} color={status.color} size="small" />
        {course && order.status === 'PAID' && (
          <Button
            size="small"
            onClick={() => navigate(ROUTES.STUDENT.COURSE_LEARN(course.courseId))}
          >
            Học
          </Button>
        )}
      </Stack>
    </Box>
  );
}
