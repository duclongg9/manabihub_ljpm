import { useMemo, useState } from 'react';
import { Alert, Box, Button, Snackbar, Typography } from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AddCardIcon from '@mui/icons-material/AddCard';
import PaymentsIcon from '@mui/icons-material/Payments';
import ReplayIcon from '@mui/icons-material/Replay';
import { PageHeader } from '../../../shared/components/PageHeader/PageHeader';
import { LoadingState } from '../../../shared/components/LoadingState/LoadingState';
import { ErrorState } from '../../../shared/components/ErrorState/ErrorState';
import { useStudentWallet } from '../hooks/useStudentWallet';
import { useCreateTopUp } from '../hooks/useWalletTopUp';
import { WalletStatCard } from '../components/WalletStatCard';
import { WalletActivityTable } from '../components/WalletActivityTable';
import { WalletActivityFilters } from '../components/WalletActivityFilters';
import { TopUpDialog } from '../components/TopUpDialog';
import type { WalletActivity, WalletActivityFilter, WalletTransactionSection } from '../types';
import { EMPTY_ACTIVITY_FILTER } from '../types';
import { filterActivity, formatMoney } from '../utils';

export function StudentWalletPage() {
  const {
    summary,
    isSummaryLoading,
    isSummaryError,
    refetchSummary,
    transactions,
    isTransactionsLoading,
    isTransactionsError,
    refetchTransactions,
  } = useStudentWallet();

  const [filter, setFilter] = useState<WalletActivityFilter>(EMPTY_ACTIVITY_FILTER);
  const [isTopUpOpen, setTopUpOpen] = useState(false);
  const [topUpError, setTopUpError] = useState<string | null>(null);
  const createTopUp = useCreateTopUp();

  const isLoading = isSummaryLoading || isTransactionsLoading;
  const isError = isSummaryError || isTransactionsError;

  const visible = useMemo(() => filterActivity(transactions, filter), [transactions, filter]);
  const availableSections = useMemo(
    () => [...new Set(transactions.map((item) => item.section))] as WalletTransactionSection[],
    [transactions],
  );

  const topUps = visible.filter((item) => item.section === 'TOP_UP');
  const payments = visible.filter((item) => item.section === 'PAYMENT');
  const refunds = visible.filter((item) => item.section === 'REFUND');

  const handleTopUp = (amount: number) => {
    setTopUpError(null);
    createTopUp.mutate(amount, {
      onSuccess: (topUp) => {
        if (topUp.paymentUrl) {
          // Leaving the SPA: the provider owns the next step and redirects back to the
          // top-up return page, which is what actually confirms the credit.
          window.location.assign(topUp.paymentUrl);
          return;
        }
        setTopUpError('Không nhận được liên kết thanh toán. Vui lòng thử lại.');
      },
      onError: () => setTopUpError('Không thể tạo yêu cầu nạp tiền. Vui lòng thử lại.'),
    });
  };

  return (
    <Box component="main" sx={{ minHeight: '100vh', bgcolor: '#FAF9F6', py: { xs: 3, md: 5 }, px: { xs: 2, sm: 3 } }}>
      <Box sx={{ maxWidth: '1280px', mx: 'auto', width: '100%', position: 'relative' }}>
        <Typography
          variant="h1"
          sx={{
            position: 'absolute', top: -40, right: -20, fontSize: '15rem', fontWeight: 900,
            color: 'rgba(0,0,0,0.025)', userSelect: 'none', pointerEvents: 'none', zIndex: 0,
            writingMode: 'vertical-rl',
          }}
        >
          財布
        </Typography>

        <PageHeader
          title="Ví của tôi"
          subtitle="マイウォレット"
          breadcrumbs={[{ label: 'Học viên' }, { label: 'Ví của tôi' }]}
        />

        <Box sx={{ position: 'relative', zIndex: 1 }}>
          {isLoading && <LoadingState message="Đang tải thông tin ví..." fullHeight />}

          {!isLoading && isError && (
            <ErrorState
              title="Không thể tải ví"
              message="Vui lòng kiểm tra kết nối và thử lại."
              onRetry={() => {
                refetchSummary();
                refetchTransactions();
              }}
            />
          )}

          {!isLoading && !isError && summary && (
            <>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                <WalletStatCard
                  label="Số dư khả dụng"
                  value={formatMoney(summary.balance, summary.currency)}
                  accent="#C41E3A"
                  icon={<AccountBalanceWalletIcon fontSize="small" />}
                />
                <WalletStatCard
                  label="Tổng đã nạp"
                  value={formatMoney(summary.totalTopUps, summary.currency)}
                  icon={<AddCardIcon fontSize="small" />}
                />
                <WalletStatCard
                  label="Tổng đã thanh toán"
                  value={formatMoney(summary.totalPayments, summary.currency)}
                  icon={<PaymentsIcon fontSize="small" />}
                />
                <WalletStatCard
                  label="Tổng đã hoàn tiền"
                  value={formatMoney(summary.totalRefunds, summary.currency)}
                  icon={<ReplayIcon fontSize="small" />}
                />
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<AddCardIcon />}
                  onClick={() => setTopUpOpen(true)}
                  sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, bgcolor: '#C41E3A' }}
                >
                  Nạp tiền
                </Button>
              </Box>

              <WalletActivityFilters
                value={filter}
                availableSections={availableSections}
                onChange={setFilter}
              />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <Section
                  title="Nạp tiền"
                  subtitle="Lịch sử nạp tiền vào ví"
                  items={topUps}
                  emptyTitle="Chưa có giao dịch nạp tiền"
                  emptyDescription="Nhấn Nạp tiền để thêm số dư vào ví của bạn."
                />
                <Section
                  title="Thanh toán"
                  subtitle="Lịch sử thanh toán khóa học"
                  items={payments}
                  emptyTitle="Chưa có giao dịch thanh toán"
                  emptyDescription="Các đơn hàng đã thanh toán sẽ hiển thị tại đây."
                />
                <Section
                  title="Hoàn tiền"
                  subtitle="Lịch sử hoàn tiền"
                  items={refunds}
                  emptyTitle="Chưa có giao dịch hoàn tiền"
                  emptyDescription="Các yêu cầu hoàn tiền đã xử lý sẽ hiển thị tại đây."
                />
              </Box>

              <TopUpDialog
                open={isTopUpOpen}
                currency={summary.currency}
                isSubmitting={createTopUp.isPending}
                errorMessage={topUpError}
                onClose={() => {
                  setTopUpOpen(false);
                  setTopUpError(null);
                }}
                onSubmit={handleTopUp}
              />
            </>
          )}
        </Box>
      </Box>

      <Snackbar
        open={Boolean(topUpError) && !isTopUpOpen}
        autoHideDuration={5000}
        onClose={() => setTopUpError(null)}
      >
        <Alert severity="error" onClose={() => setTopUpError(null)}>
          {topUpError}
        </Alert>
      </Snackbar>
    </Box>
  );
}

function Section({
  title,
  subtitle,
  items,
  emptyTitle,
  emptyDescription,
}: {
  title: string;
  subtitle: string;
  items: WalletActivity[];
  emptyTitle: string;
  emptyDescription: string;
}) {
  return (
    <Box>
      <Box sx={{ mb: 1.5 }}>
        <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: 'grey.900' }}>{title}</Typography>
        <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>{subtitle}</Typography>
      </Box>
      <WalletActivityTable items={items} emptyTitle={emptyTitle} emptyDescription={emptyDescription} />
    </Box>
  );
}
