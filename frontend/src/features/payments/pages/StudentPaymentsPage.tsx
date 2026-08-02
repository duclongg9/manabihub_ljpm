import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Pagination,
  Stack,
  Typography,
} from '@mui/material';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../shared/components/PageHeader/PageHeader';
import { ROUTES } from '../../../shared/constants/routes';
import type { OrderItemResponse, OrderResponse } from '../../checkout/types';
import { RefundRequestDialog } from '../../refunds/components/RefundRequestDialog';
import { StudentRefundHistory } from '../../refunds/components/StudentRefundHistory';
import { useStudentRefunds } from '../../refunds/hooks/useStudentRefunds';
import type { StudentRefundResponse } from '../../refunds/types';
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

const ORDER_STATUS: Record<OrderStatus, { label: string; color: 'default' | 'success' | 'warning' | 'error' | 'info' }> = {
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
  const [dialogItem, setDialogItem] = useState<OrderItemResponse | null>(null);
  const [dialogRefund, setDialogRefund] = useState<StudentRefundResponse | null>(null);
  const selectedFilter = FILTERS[filterIndex];
  const ordersQuery = useOrderHistory({ page, size: 10, status: selectedFilter.status });
  const refundsQuery = useStudentRefunds();
  const orders = ordersQuery.data?.content ?? [];
  const refunds = refundsQuery.data?.content ?? [];

  const latestRefundByItem = new Map<string, StudentRefundResponse>();
  refunds.forEach((refund) => {
    if (!latestRefundByItem.has(refund.orderItemId)) {
      latestRefundByItem.set(refund.orderItemId, refund);
    }
  });

  const openNewRefund = (item: OrderItemResponse) => {
    setDialogItem(item);
    setDialogRefund(null);
  };

  const openRefundDetail = (refund: StudentRefundResponse) => {
    const item = orders.flatMap((order) => order.items)
      .find((candidate) => candidate.id === refund.orderItemId) ?? {
        id: refund.orderItemId,
        courseId: refund.courseId,
        courseTitle: refund.courseTitle,
        price: refund.eligibilitySnapshot.actuallyPaidAmount,
      };
    setDialogItem(item);
    setDialogRefund(refund);
  };

  return (
    <Box component="main" sx={{ minHeight: '100%', bgcolor: '#FAF9F6', px: { xs: 2, md: 4 }, py: { xs: 3, md: 5 } }}>
      <Box sx={{ maxWidth: 1180, mx: 'auto' }}>
        <PageHeader
          title="Lịch sử thanh toán"
          subtitle="購入履歴"
          breadcrumbs={[{ label: 'Học viên' }, { label: 'Lịch sử thanh toán' }]}
        />

        <Box sx={{ border: '1px solid #E1E5EA', borderRadius: 2, bgcolor: '#fff', overflow: 'hidden' }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ p: 2.5, justifyContent: 'space-between', alignItems: { md: 'center' } }}>
            <Box>
              <Typography sx={{ fontWeight: 900 }}>Đơn hàng của bạn</Typography>
              <Typography variant="body2" color="text.secondary">
                Theo dõi giao dịch mua khóa học, nạp ví và gửi yêu cầu hoàn tiền khi cần.
              </Typography>
            </Box>
            <Stack direction="row" spacing={0.5} sx={{ overflowX: 'auto' }}>
              {FILTERS.map((filter, index) => (
                <Button
                  key={filter.label}
                  variant={filterIndex === index ? 'contained' : 'text'}
                  aria-pressed={filterIndex === index}
                  onClick={() => { setFilterIndex(index); setPage(0); }}
                  sx={{ minWidth: 'max-content' }}
                >
                  {filter.label}
                </Button>
              ))}
            </Stack>
          </Stack>
          <Divider />

          {ordersQuery.isError && (
            <Alert severity="error" sx={{ m: 2 }} action={<Button onClick={() => void ordersQuery.refetch()}>Thử lại</Button>}>
              Không thể tải lịch sử thanh toán.
            </Alert>
          )}
          {ordersQuery.isLoading && (
            <Stack spacing={1.5} sx={{ minHeight: 260, alignItems: 'center', justifyContent: 'center' }}>
              <CircularProgress aria-label="Đang tải lịch sử thanh toán" />
              <Typography color="text.secondary">Đang tải giao dịch…</Typography>
            </Stack>
          )}
          {!ordersQuery.isLoading && !ordersQuery.isError && orders.length === 0 && (
            <Stack spacing={1.5} sx={{ minHeight: 280, alignItems: 'center', justifyContent: 'center', p: 3, textAlign: 'center' }}>
              <ReceiptLongOutlinedIcon sx={{ fontSize: 56, color: 'text.disabled' }} />
              <Typography variant="h6" sx={{ fontWeight: 900 }}>Chưa có đơn hàng phù hợp</Typography>
              <Button variant="contained" onClick={() => navigate(ROUTES.STUDENT.BROWSE_COURSES)}>
                Khám phá khóa học
              </Button>
            </Stack>
          )}

          <Stack divider={<Divider flexItem />}>
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                latestRefundByItem={latestRefundByItem}
                onRequestRefund={openNewRefund}
                onOpenRefund={openRefundDetail}
              />
            ))}
          </Stack>

          {(ordersQuery.data?.totalPages ?? 0) > 1 && (
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
              <Pagination
                count={ordersQuery.data?.totalPages ?? 1}
                page={page + 1}
                onChange={(_, value) => setPage(value - 1)}
              />
            </Box>
          )}
        </Box>

        <StudentRefundHistory
          refunds={refunds}
          loading={refundsQuery.isLoading}
          error={refundsQuery.isError}
          onRetry={() => void refundsQuery.refetch()}
          onOpen={openRefundDetail}
        />
      </Box>

      <RefundRequestDialog
        open={dialogItem !== null}
        orderItem={dialogItem}
        existingRefund={dialogRefund}
        onClose={() => { setDialogItem(null); setDialogRefund(null); }}
      />
    </Box>
  );
}

function OrderCard({
  order,
  latestRefundByItem,
  onRequestRefund,
  onOpenRefund,
}: {
  order: OrderResponse;
  latestRefundByItem: Map<string, StudentRefundResponse>;
  onRequestRefund: (item: OrderItemResponse) => void;
  onOpenRefund: (refund: StudentRefundResponse) => void;
}) {
  const presentation = ORDER_STATUS[order.status];
  const isWalletTopUp = order.type === 'WALLET_TOPUP';

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography sx={{ fontWeight: 900 }}>{order.orderCode}</Typography>
          <Typography variant="body2" color="text.secondary">
            {new Date(order.createdAt).toLocaleDateString('vi-VN')} · {formatMoney(order.totalAmount, order.currency)}
          </Typography>
        </Box>
        <Chip label={presentation.label} color={presentation.color} size="small" />
      </Stack>

      <Stack spacing={1.25}>
        {isWalletTopUp ? (
          <Stack sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: 1.5 }}>
            <Typography sx={{ fontWeight: 800 }}>
              Nạp {formatMoney(order.totalAmount, order.currency)} vào ví
            </Typography>
          </Stack>
        ) : (
          order.items.map((item) => {
            const refund = latestRefundByItem.get(item.id);
            const canSubmitAgain = refund?.status === 'REJECTED' || refund?.status === 'CANCELLED';
            return (
              <Stack
                key={item.id}
                direction={{ xs: 'column', md: 'row' }}
                spacing={1}
                sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: 1.5, justifyContent: 'space-between', alignItems: { md: 'center' } }}
              >
                <Box>
                  <Typography sx={{ fontWeight: 800 }}>{item.courseTitle}</Typography>
                  <Typography variant="body2" color="text.secondary">{formatMoney(item.price, order.currency)}</Typography>
                </Box>
                {order.status === 'PAID' && (
                  <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap' }}>
                    {refund && (
                      <Button size="small" variant="outlined" onClick={() => onOpenRefund(refund)}>
                        Xem hoàn tiền
                      </Button>
                    )}
                    {(!refund || canSubmitAgain) && (
                      <Button size="small" variant="outlined" onClick={() => onRequestRefund(item)}>
                        {canSubmitAgain ? 'Yêu cầu lại' : 'Yêu cầu hoàn tiền'}
                      </Button>
                    )}
                  </Stack>
                )}
              </Stack>
            );
          })
        )}
      </Stack>
    </Box>
  );
}
