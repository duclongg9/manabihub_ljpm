import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Pagination,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../shared/components/PageHeader/PageHeader';
import { DecorativeKanjiWatermark } from '../../../shared/components/DecorativeKanjiWatermark/DecorativeKanjiWatermark';
import { ROUTES } from '../../../shared/constants/routes';
import type { OrderItemResponse, OrderResponse } from '../../checkout/types';
import { RefundRequestDialog } from '../../refunds/components/RefundRequestDialog';
import { StudentRefundHistory } from '../../refunds/components/StudentRefundHistory';
import { useStudentRefunds } from '../../refunds/hooks/useStudentRefunds';
import type { StudentRefundResponse } from '../../refunds/types';
import { useOrderHistory } from '../hooks/useOrderHistory';
import type { OrderStatus } from '../services/orderHistoryService';
import { getStudentWallet, getStudentWithdrawals } from '../../wallet/services/studentWalletService';
import type { StudentWalletResponse, StudentWithdrawal } from '../../wallet/types';
import { useCommercialPolicy } from '../../help-center/hooks/useCommercialPolicy';
import { StudentWithdrawalModal } from '../../wallet/components/StudentWithdrawalModal';
import { StudentWithdrawalHistory } from '../../wallet/components/StudentWithdrawalHistory';

interface FilterOption {
  label: string;
  status?: OrderStatus;
}

const FILTERS: FilterOption[] = [
  { label: 'Tất cả' },
  { label: 'Thành công', status: 'PAID' },
  { label: 'Chờ thanh toán', status: 'PENDING' },
  { label: 'Thất bại', status: 'FAILED' },
  { label: 'Đã hủy', status: 'CANCELLED' },
  { label: 'Đã hoàn tiền', status: 'REFUNDED' },
];

const ORDER_STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; bgcolor: string; color: string }
> = {
  PAID: { label: 'Đã thanh toán', bgcolor: '#ECFDF5', color: '#047857' },
  REFUNDED: { label: 'Đã hoàn tiền', bgcolor: '#EFF6FF', color: '#1D4ED8' },
  PENDING: { label: 'Chờ thanh toán', bgcolor: '#FFFBEB', color: '#B45309' },
  FAILED: { label: 'Thất bại', bgcolor: '#FEF2F2', color: '#B91C1C' },
  CANCELLED: { label: 'Đã hủy', bgcolor: '#F3F4F6', color: '#4B5563' },
};

const REFUND_ACTION_BUTTON_STYLE = {
  borderColor: '#C41E3A',
  color: '#C41E3A',
  borderRadius: 2,
  fontWeight: 700,
  fontSize: '0.85rem',
  textTransform: 'none',
  px: 2,
  py: 0.4,
  lineHeight: 1.5,
  whiteSpace: 'nowrap',
  transition: 'all 0.15s ease',
  '&:hover': {
    borderColor: '#9D182E',
    bgcolor: '#FEF2F2',
    color: '#9D182E',
  },
};

function formatMoney(amount: number, currency: string = 'VND') {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function StudentPaymentsPage() {
  const navigate = useNavigate();
  const [mainTab, setMainTab] = useState(0); // 0 = Lịch sử đơn hàng, 1 = Lịch sử rút tiền

  const [filterIndex, setFilterIndex] = useState(0);
  const [page, setPage] = useState(0);
  const [dialogItem, setDialogItem] = useState<OrderItemResponse | null>(null);
  const [dialogRefund, setDialogRefund] = useState<StudentRefundResponse | null>(null);

  // Wallet state
  const [wallet, setWallet] = useState<StudentWalletResponse | null>(null);
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [withdrawalModalOpen, setWithdrawalModalOpen] = useState(false);

  // Withdrawals history state
  const [withdrawals, setWithdrawals] = useState<StudentWithdrawal[]>([]);
  const [withdrawalPage, setWithdrawalPage] = useState(0);
  const [withdrawalTotalPages, setWithdrawalTotalPages] = useState(1);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(true);
  const [errorWithdrawals, setErrorWithdrawals] = useState(false);

  const policyQuery = useCommercialPolicy();
  const minimumAmount = policyQuery.data?.payoutThreshold ?? 100000;

  const selectedFilter = FILTERS[filterIndex];
  const ordersQuery = useOrderHistory({ page, size: 10, status: selectedFilter.status });
  const refundsQuery = useStudentRefunds();

  // Filter out WALLET_TOPUP transactions from student order history
  const rawOrders = ordersQuery.data?.content ?? [];
  const courseOrders = rawOrders.filter((order) => order.type !== 'WALLET_TOPUP');
  const refunds = refundsQuery.data?.content ?? [];

  const loadWalletData = useCallback(async () => {
    try {
      const data = await getStudentWallet();
      setWallet(data);
    } catch {
      // transient balance fetch error
    } finally {
      setLoadingWallet(false);
    }
  }, []);

  const loadWithdrawalData = useCallback(async (targetPage: number = withdrawalPage) => {
    setLoadingWithdrawals(true);
    setErrorWithdrawals(false);
    try {
      const res = await getStudentWithdrawals(targetPage, 10);
      setWithdrawals(res.content ?? []);
      setWithdrawalTotalPages(res.totalPages ?? 1);
    } catch {
      setErrorWithdrawals(true);
    } finally {
      setLoadingWithdrawals(false);
    }
  }, [withdrawalPage]);

  useEffect(() => {
    void loadWalletData();
    void loadWithdrawalData(withdrawalPage);
  }, [loadWalletData, loadWithdrawalData, withdrawalPage]);

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
    const item = courseOrders.flatMap((order) => order.items)
      .find((candidate) => candidate.id === refund.orderItemId) ?? {
        id: refund.orderItemId,
        courseId: refund.courseId,
        courseTitle: refund.courseTitle,
        price: refund.eligibilitySnapshot.actuallyPaidAmount,
      };
    setDialogItem(item);
    setDialogRefund(refund);
  };

  const refreshAll = async () => {
    await Promise.all([
      loadWalletData(),
      loadWithdrawalData(withdrawalPage),
      ordersQuery.refetch(),
      refundsQuery.refetch(),
    ]);
  };

  return (
    <Box component="main" sx={{ minHeight: '100%', bgcolor: '#FAF9F6', px: { xs: 2, md: 4 }, py: { xs: 3, md: 5 } }}>
      <Box sx={{ maxWidth: 1180, mx: 'auto', position: 'relative', overflow: 'hidden' }}>
        <DecorativeKanjiWatermark text="履歴" />
        <Box sx={{ position: 'relative', zIndex: 1 }}>
        <PageHeader
          title="Ví & Thanh toán"
          subtitle="Thanh toán & Số dư tiền hoàn"
          breadcrumbs={[{ label: 'Học viên' }, { label: 'Ví & Thanh toán' }]}
        />

        {/* Refund wallet and withdrawal action live with payment history. Direct top-up is not offered. */}
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 1.25fr)' },
            mb: 2.5,
          }}
        >
          <Box
            sx={{
              bgcolor: '#C41E3A',
              background: 'linear-gradient(135deg, #C41E3A 0%, #9D182E 100%)',
              borderRadius: 3,
              boxShadow: '0 10px 24px rgba(157, 24, 46, 0.22)',
              color: '#fff',
              minHeight: { md: 242 },
              overflow: 'hidden',
              p: { xs: 2.5, sm: 3 },
              position: 'relative',
            }}
          >
            <AccountBalanceWalletIcon
              aria-hidden="true"
              sx={{
                bottom: -24,
                fontSize: 180,
                opacity: 0.12,
                position: 'absolute',
                right: -18,
                transform: 'rotate(-10deg)',
              }}
            />
            <Stack spacing={2.25} sx={{ position: 'relative', zIndex: 1 }}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <Box sx={{ bgcolor: 'rgba(255,255,255,0.16)', borderRadius: 2, display: 'grid', p: 1.1, placeItems: 'center' }}>
                  <AccountBalanceWalletIcon />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 900 }}>Ví học viên</Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.78)' }}>
                    Tiền hoàn dùng để mua khóa học
                  </Typography>
                </Box>
              </Stack>
              <Box>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.78)', mb: 0.5 }}>
                  Số dư khả dụng
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 900 }}>
                  {loadingWallet ? '…' : formatMoney(wallet?.availableBalance ?? 0, wallet?.currency ?? 'VND')}
                </Typography>
              </Box>
              <Stack direction="row" divider={<Box sx={{ borderLeft: '1px solid rgba(255,255,255,0.24)' }} />} spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>Có thể rút</Typography>
                  <Typography sx={{ fontWeight: 800 }}>
                    {loadingWallet ? '…' : formatMoney(wallet?.availableWithdrawableBalance ?? 0, wallet?.currency ?? 'VND')}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, pl: 1 }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>Đang xử lý</Typography>
                  <Typography sx={{ fontWeight: 800 }}>
                    {loadingWallet ? '…' : formatMoney(wallet?.frozenBalance ?? 0, wallet?.currency ?? 'VND')}
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          </Box>

          <Box
            sx={{
              bgcolor: '#fff',
              border: '1px solid #E1E5EA',
              borderRadius: 3,
              boxShadow: '0 4px 16px rgba(15, 23, 42, 0.05)',
              p: { xs: 2.5, sm: 3 },
            }}
          >
            <Stack spacing={2} sx={{ height: '100%', justifyContent: 'center' }}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <Box sx={{ bgcolor: '#FFF1F2', borderRadius: 2, color: '#C41E3A', display: 'grid', p: 1.1, placeItems: 'center' }}>
                  <AccountBalanceIcon />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 900 }}>Rút tiền hoàn</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Chuyển khoản hoàn tiền về tài khoản ngân hàng chính chủ.
                  </Typography>
                </Box>
              </Stack>
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                Chỉ số dư từ các khoản hoàn tiền hợp lệ mới được rút. Tài khoản cần xác thực số điện thoại và CCCD.
              </Alert>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Tối thiểu {formatMoney(minimumAmount, wallet?.currency ?? 'VND')}
                </Typography>
                <Button
                  variant="contained"
                  disabled={loadingWallet || (wallet?.availableWithdrawableBalance ?? 0) < minimumAmount}
                  onClick={() => setWithdrawalModalOpen(true)}
                  sx={{ bgcolor: '#C41E3A', '&:hover': { bgcolor: '#9D182E' }, borderRadius: 10, fontWeight: 800, px: 3, textTransform: 'none' }}
                >
                  Yêu cầu rút tiền
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Box>

        {/* Sub-tabs Navigation */}
        <Box sx={{ mb: 2.5, borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={mainTab}
            onChange={(_, newValue) => setMainTab(newValue)}
            sx={{
              '& .MuiTab-root': {
                fontWeight: 700,
                fontSize: '0.95rem',
                textTransform: 'none',
                minHeight: 48,
                px: 3,
                minWidth: 160,
              },
              '& .Mui-selected': {
                color: '#C41E3A !important',
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#C41E3A',
                height: 3,
                borderRadius: '3px 3px 0 0',
              },
            }}
          >
            <Tab icon={<ShoppingBagOutlinedIcon fontSize="small" />} iconPosition="start" label="Lịch sử đơn hàng" />
            <Tab icon={<AccountBalanceIcon fontSize="small" />} iconPosition="start" label="Lịch sử rút tiền" />
          </Tabs>
        </Box>

        {/* SUBTAB 1: Lịch sử đơn hàng */}
        {mainTab === 0 && (
          <Box>
            {/* Filter Pills Header (Directly on page background) */}
            <Box sx={{ mb: 2.5 }}>
              <Stack
                direction="row"
                spacing={1.5}
                sx={{
                  overflowX: 'auto',
                  py: 0.5,
                  '&::-webkit-scrollbar': { display: 'none' },
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                }}
              >
                {FILTERS.map((filter, index) => {
                  const isActive = filterIndex === index;
                  return (
                    <Button
                      key={filter.label}
                      variant="text"
                      aria-pressed={isActive}
                      onClick={() => { setFilterIndex(index); setPage(0); }}
                      sx={{
                        minWidth: 'max-content',
                        borderRadius: 10,
                        px: 2.5,
                        py: 0.75,
                        fontWeight: isActive ? 800 : 600,
                        fontSize: '0.875rem',
                        textTransform: 'none',
                        bgcolor: isActive ? '#C41E3A' : '#FFFFFF',
                        color: isActive ? '#FFFFFF' : '#475569',
                        border: isActive ? '1px solid #C41E3A' : '1px solid #E2E8F0',
                        boxShadow: isActive ? '0 2px 6px rgba(196, 30, 58, 0.2)' : '0 1px 2px rgba(0,0,0,0.02)',
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          bgcolor: isActive ? '#9D182E' : '#F8FAFC',
                          borderColor: isActive ? '#9D182E' : '#CBD5E1',
                          color: isActive ? '#FFFFFF' : '#0F172A',
                        },
                      }}
                    >
                      {filter.label}
                    </Button>
                  );
                })}
              </Stack>
            </Box>

            {ordersQuery.isError && (
              <Alert severity="error" sx={{ mb: 2 }} action={<Button onClick={() => void ordersQuery.refetch()}>Thử lại</Button>}>
                Không thể tải lịch sử thanh toán.
              </Alert>
            )}

            {ordersQuery.isLoading && (
              <Stack spacing={1.5} sx={{ minHeight: 260, alignItems: 'center', justifyContent: 'center', bgcolor: '#FFF', borderRadius: 3, border: '1px solid #E1E5EA' }}>
                <CircularProgress aria-label="Đang tải lịch sử thanh toán" sx={{ color: '#C41E3A' }} />
                <Typography color="text.secondary">Đang tải giao dịch…</Typography>
              </Stack>
            )}

            {!ordersQuery.isLoading && !ordersQuery.isError && courseOrders.length === 0 && (
              <Stack spacing={1.5} sx={{ minHeight: 280, alignItems: 'center', justifyContent: 'center', p: 3, textAlign: 'center', bgcolor: '#FFF', borderRadius: 3, border: '1px solid #E1E5EA' }}>
                <ReceiptLongOutlinedIcon sx={{ fontSize: 56, color: 'text.disabled' }} />
                <Typography variant="h6" sx={{ fontWeight: 900 }}>Chưa có đơn hàng nào</Typography>
                <Button
                  variant="contained"
                  onClick={() => navigate(ROUTES.STUDENT.BROWSE_COURSES)}
                  sx={{ bgcolor: '#C41E3A', '&:hover': { bgcolor: '#9D182E' }, borderRadius: 10, fontWeight: 700, textTransform: 'none', px: 3 }}
                >
                  Khám phá khóa học
                </Button>
              </Stack>
            )}

            {/* Standalone elevated cards with clean spacing */}
            <Stack spacing={2}>
              {courseOrders.map((order) => (
                <Box
                  key={order.id}
                  sx={{
                    bgcolor: '#FFFFFF',
                    borderRadius: 3,
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                      borderColor: '#CBD5E1',
                    },
                  }}
                >
                  <OrderCard
                    order={order}
                    latestRefundByItem={latestRefundByItem}
                    onRequestRefund={openNewRefund}
                    onOpenRefund={openRefundDetail}
                  />
                </Box>
              ))}
            </Stack>

            {/* Polished Pagination */}
            {(ordersQuery.data?.totalPages ?? 0) > 1 && (
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                <Pagination
                  count={ordersQuery.data?.totalPages ?? 1}
                  page={page + 1}
                  onChange={(_, value) => setPage(value - 1)}
                  sx={{
                    '& .MuiPaginationItem-root': {
                      borderRadius: 2,
                      fontWeight: 700,
                      color: '#475569',
                      border: '1px solid #E2E8F0',
                      bgcolor: '#FFFFFF',
                      '&.Mui-selected': {
                        bgcolor: '#C41E3A !important',
                        color: '#FFFFFF !important',
                        borderColor: '#C41E3A',
                      },
                      '&:hover': {
                        bgcolor: 'rgba(196, 30, 58, 0.08)',
                      },
                    },
                  }}
                />
              </Box>
            )}
          </Box>
        )}

        {mainTab === 0 && (
          <StudentRefundHistory
            refunds={refunds}
            loading={refundsQuery.isLoading}
            error={refundsQuery.isError}
            onRetry={() => void refundsQuery.refetch()}
            onOpen={openRefundDetail}
          />
        )}

        {/* SUBTAB 2: Lịch sử rút tiền */}
        {mainTab === 1 && (
          <Box
            sx={{
              p: { xs: 2, md: 2.5 },
              bgcolor: '#FFFFFF',
              borderRadius: 3,
              border: '1px solid #E1E5EA',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}
          >
            <StudentWithdrawalHistory
              withdrawals={withdrawals}
              loading={loadingWithdrawals}
              error={errorWithdrawals}
              onRetry={() => void loadWithdrawalData(withdrawalPage)}
              onChanged={() => loadWithdrawalData(withdrawalPage)}
              page={withdrawalPage}
              totalPages={withdrawalTotalPages}
              onPageChange={setWithdrawalPage}
            />
          </Box>
        )}
        </Box>
      </Box>

      {/* Refund request dialog */}
      <RefundRequestDialog
        open={dialogItem !== null}
        orderItem={dialogItem}
        existingRefund={dialogRefund}
        onClose={() => { setDialogItem(null); setDialogRefund(null); }}
      />

      {/* Withdrawal modal */}
      <StudentWithdrawalModal
        open={withdrawalModalOpen}
        onClose={() => setWithdrawalModalOpen(false)}
        wallet={wallet}
        minimumAmount={minimumAmount}
        onSuccess={refreshAll}
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
  const presentation = ORDER_STATUS_CONFIG[order.status] ?? {
    label: order.status,
    bgcolor: '#F3F4F6',
    color: '#4B5563',
  };

  return (
    <Box sx={{ p: { xs: 2.5, md: 3 } }}>
      {/* Header: Secondary Order code & Date on left, Soft Status Badge aligned to right edge */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, mb: 2 }}>
        <Box>
          <Typography sx={{ fontWeight: 600, color: '#64748B', fontSize: '0.85rem', fontFamily: 'monospace', letterSpacing: '0.2px' }}>
            {order.orderCode}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
            Ngày mua: {new Date(order.createdAt).toLocaleDateString('vi-VN')}
          </Typography>
        </Box>
        <Chip
          label={presentation.label}
          size="small"
          sx={{
            fontWeight: 700,
            fontSize: '0.75rem',
            bgcolor: presentation.bgcolor,
            color: presentation.color,
            border: 'none',
            px: 0.75,
            alignSelf: { xs: 'flex-start', sm: 'center' },
            mr: 0,
          }}
        />
      </Stack>

      {/* Items: Clear hierarchy - Course title is primary focus */}
      <Stack spacing={1.5}>
        {order.items.map((item, index) => {
          const refund = latestRefundByItem.get(item.id);

          const isRejected = refund?.status === 'REJECTED';
          const isPendingOrActive = refund && ['PENDING', 'APPROVED', 'PROCESSED', 'COMPLETED'].includes(refund.status);

          return (
            <Box
              key={item.id}
              sx={{
                pt: index > 0 ? 1.5 : 0,
                borderTop: index > 0 ? '1px solid #F1F5F9' : 'none',
              }}
            >
              {/* Primary focus: Course Title */}
              <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#0F172A', mb: 0.75 }}>
                {item.courseTitle}
              </Typography>

              {/* Bottom row: Price on Left, Unified Action Buttons on Right */}
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.5}
                sx={{
                  justifyContent: 'space-between',
                  alignItems: { sm: 'center' },
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#475569', fontSize: '0.9rem' }}>
                  {formatMoney(item.price, order.currency)}
                </Typography>

                <Box sx={{ alignSelf: { xs: 'flex-start', sm: 'center' }, display: 'flex', justifyContent: 'flex-end' }}>
                  {isPendingOrActive ? (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => onOpenRefund(refund)}
                      sx={REFUND_ACTION_BUTTON_STYLE}
                    >
                      Xem chi tiết hoàn tiền
                    </Button>
                  ) : order.status === 'PAID' && item.price > 0 ? (
                    isRejected ? (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => onRequestRefund(item)}
                        sx={REFUND_ACTION_BUTTON_STYLE}
                      >
                        Yêu cầu hoàn tiền lại
                      </Button>
                    ) : (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => onRequestRefund(item)}
                        sx={REFUND_ACTION_BUTTON_STYLE}
                      >
                        Yêu cầu hoàn tiền
                      </Button>
                    )
                  ) : order.status === 'PENDING' ? (
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontStyle: 'italic', fontWeight: 500 }}>
                      Đơn hàng đang chờ thanh toán VNPay
                    </Typography>
                  ) : order.status === 'FAILED' ? (
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontStyle: 'italic', fontWeight: 500 }}>
                      Thanh toán không thành công
                    </Typography>
                  ) : order.status === 'CANCELLED' ? (
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontStyle: 'italic', fontWeight: 500 }}>
                      Thanh toán đã được hủy
                    </Typography>
                  ) : null}
                </Box>
              </Stack>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}
