import React, { useMemo, useState } from 'react';
import { Box, Snackbar, Alert, Typography } from '@mui/material';
import axios from 'axios';
import { PageHeader } from '../../../shared/components/PageHeader/PageHeader';
import { ErrorState } from '../../../shared/components/ErrorState/ErrorState';
import { LoadingState } from '../../../shared/components/LoadingState/LoadingState';
import { StudentWalletSummary } from '../components/StudentWalletSummary';
import { TeacherWalletSummary } from '../components/TeacherWalletSummary';
import { TopUpDialog } from '../components/TopUpDialog';
import { WalletTransactionHistory } from '../components/WalletTransactionHistory';
import { WithdrawalHistory } from '../components/WithdrawalHistory';
import { walletMessage } from '../constants/walletLabels';
import {
  useCreateTopUp,
  useStudentWallet,
  useTeacherWallet,
  useTeacherWithdrawals,
  useWalletTransactions,
} from '../hooks/useWallet';
import type {
  WalletTransactionDirection,
  WalletTransactionType,
} from '../types/walletTypes';

const PAGE_SIZE = 10;

/** Transaction types each role is allowed to see (mirrors WalletTransactionType). */
const STUDENT_TYPES: WalletTransactionType[] = ['TOP_UP', 'PURCHASE', 'REFUND', 'ADJUSTMENT'];
const TEACHER_TYPES: WalletTransactionType[] = [
  'REVENUE_SHARE',
  'ESCROW_RELEASE',
  'PAYOUT',
  'ADJUSTMENT',
];

interface MyWalletPageProps {
  /**
   * Which wallet to render. The route decides it — `/student/wallet` sits behind
   * StudentLayout and `/teacher/wallet` behind TeacherLayout — so the component
   * never guesses the role from the token (BR-RBAC-01).
   */
  role: 'STUDENT' | 'TEACHER';
}

/**
 * UC-17 Manage My Wallet.
 *
 * One screen, two role-specific data sets. The Student half shows top-up,
 * payment and refund sections; the Teacher half shows pending escrow, available
 * balance, withdrawal history and payout status.
 */
export const MyWalletPage: React.FC<MyWalletPageProps> = ({ role }) => {
  const isStudent = role === 'STUDENT';

  const [transactionPage, setTransactionPage] = useState(0);
  const [withdrawalPage, setWithdrawalPage] = useState(0);
  const [typeFilter, setTypeFilter] = useState<WalletTransactionType | 'ALL'>('ALL');
  const [directionFilter, setDirectionFilter] = useState<WalletTransactionDirection | 'ALL'>('ALL');
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [topUpError, setTopUpError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const studentWallet = useStudentWallet(isStudent);
  const teacherWallet = useTeacherWallet(!isStudent);

  const transactionQuery = useMemo(
    () => ({
      type: typeFilter === 'ALL' ? undefined : typeFilter,
      direction: directionFilter === 'ALL' ? undefined : directionFilter,
      page: transactionPage,
      size: PAGE_SIZE,
    }),
    [typeFilter, directionFilter, transactionPage],
  );

  const transactions = useWalletTransactions(role, transactionQuery);
  const withdrawals = useTeacherWithdrawals(withdrawalPage, !isStudent);
  const createTopUp = useCreateTopUp();

  const overviewLoading = isStudent ? studentWallet.isLoading : teacherWallet.isLoading;
  const overviewError = isStudent ? studentWallet.isError : teacherWallet.isError;
  const currency = (isStudent ? studentWallet.data?.currency : teacherWallet.data?.currency) ?? 'VND';

  const handleFilterChange = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setTransactionPage(0);
  };

  const handleTopUpSubmit = (amount: number) => {
    setTopUpError(null);
    createTopUp.mutate(amount, {
      onSuccess: () => {
        setTopUpOpen(false);
        setToast(walletMessage('WALLET_TOP_UP_CREATED'));
      },
      onError: (error) => setTopUpError(walletMessage(extractMessageCode(error))),
    });
  };

  const renderOverview = () => {
    if (overviewLoading) {
      return <LoadingState message="Đang tải ví của bạn..." fullHeight />;
    }

    if (overviewError) {
      return (
        <ErrorState
          title="Không tải được ví"
          message="Đã xảy ra lỗi khi tải dữ liệu ví. Vui lòng thử lại."
          onRetry={() => (isStudent ? studentWallet.refetch() : teacherWallet.refetch())}
        />
      );
    }

    if (isStudent && studentWallet.data) {
      return (
        <StudentWalletSummary
          wallet={studentWallet.data}
          onTopUpClick={() => {
            setTopUpError(null);
            setTopUpOpen(true);
          }}
        />
      );
    }

    if (!isStudent && teacherWallet.data) {
      return <TeacherWalletSummary wallet={teacherWallet.data} />;
    }

    return null;
  };

  return (
    <Box
      component="main"
      sx={{ minHeight: '100vh', bgcolor: '#FAF9F6', py: { xs: 3, md: 5 }, px: { xs: 2, sm: 3 } }}
    >
      <Box sx={{ maxWidth: '1280px', mx: 'auto', width: '100%', position: 'relative' }}>
        <Typography
          variant="h1"
          aria-hidden
          sx={{
            position: 'absolute',
            top: -40,
            right: -20,
            fontSize: '15rem',
            fontWeight: 900,
            color: 'rgba(0,0,0,0.025)',
            userSelect: 'none',
            pointerEvents: 'none',
            zIndex: 0,
            writingMode: 'vertical-rl',
          }}
        >
          財布
        </Typography>

        <PageHeader
          title="Ví của tôi"
          subtitle="マイウォレット"
          breadcrumbs={[
            { label: isStudent ? 'Học viên' : 'Giáo viên' },
            { label: 'Ví của tôi' },
          ]}
        />

        <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {renderOverview()}

          {!overviewLoading && !overviewError && (
            <>
              {!isStudent && (
                <Box
                  sx={{
                    p: { xs: 2, md: 3 },
                    borderRadius: 4,
                    bgcolor: '#FFFFFF',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.02)',
                  }}
                >
                  <WithdrawalHistory
                    withdrawals={withdrawals.data?.content ?? []}
                    currency={currency}
                    page={withdrawalPage}
                    totalPages={withdrawals.data?.totalPages ?? 0}
                    isLoading={withdrawals.isLoading}
                    isError={withdrawals.isError}
                    onPageChange={setWithdrawalPage}
                    onRetry={() => withdrawals.refetch()}
                  />
                </Box>
              )}

              <Box
                sx={{
                  p: { xs: 2, md: 3 },
                  borderRadius: 4,
                  bgcolor: '#FFFFFF',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.02)',
                }}
              >
                <WalletTransactionHistory
                  availableTypes={isStudent ? STUDENT_TYPES : TEACHER_TYPES}
                  transactions={transactions.data?.content ?? []}
                  currency={currency}
                  page={transactionPage}
                  totalPages={transactions.data?.totalPages ?? 0}
                  isLoading={transactions.isLoading}
                  isError={transactions.isError}
                  typeFilter={typeFilter}
                  directionFilter={directionFilter}
                  onTypeFilterChange={handleFilterChange(setTypeFilter)}
                  onDirectionFilterChange={handleFilterChange(setDirectionFilter)}
                  onPageChange={setTransactionPage}
                  onRetry={() => transactions.refetch()}
                />
              </Box>
            </>
          )}
        </Box>
      </Box>

      {isStudent && (
        <TopUpDialog
          open={topUpOpen}
          currency={currency}
          isSubmitting={createTopUp.isPending}
          serverError={topUpError}
          onClose={() => setTopUpOpen(false)}
          onSubmit={handleTopUpSubmit}
        />
      )}

      <Snackbar
        open={toast !== null}
        autoHideDuration={5000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setToast(null)} sx={{ width: '100%' }}>
          {toast}
        </Alert>
      </Snackbar>
    </Box>
  );
};

/**
 * Pulls `messageCode` out of an API error so the UI can map it to Vietnamese.
 * Raw `message` text is never displayed.
 */
function extractMessageCode(error: unknown): string | null {
  if (axios.isAxiosError(error)) {
    const messageCode = error.response?.data?.messageCode;
    return typeof messageCode === 'string' ? messageCode : null;
  }
  return null;
}
