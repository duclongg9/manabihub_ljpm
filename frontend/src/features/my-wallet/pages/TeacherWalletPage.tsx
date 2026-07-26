import { useState } from 'react';
import { useTeacherWallet } from '../hooks/useTeacherWallet';
import { useTeacherWithdrawals } from '../hooks/useTeacherWithdrawals';
import { WalletBalanceCards } from '../components/WalletBalanceCards';
import { WithdrawalHistoryTable } from '../components/WithdrawalHistoryTable';
import { WithdrawalRequestModal } from '../components/WithdrawalRequestModal';
import { Tooltip } from '@mui/material';

export function TeacherWalletPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: wallet, isLoading: isLoadingWallet, isError: isWalletError, error: walletError } = useTeacherWallet();
  const { data: withdrawalsPage, isLoading: isLoadingWithdrawals } = useTeacherWithdrawals();

  if (isLoadingWallet) {
    return (
      <div className="flex h-full items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isWalletError || !wallet) {
    const messageCode = (walletError as any)?.response?.data?.messageCode;
    
    if (messageCode === 'WALLET_NOT_FOUND') {
      return (
        <div className="p-8 max-w-4xl mx-auto h-[60vh] flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Bạn chưa kích hoạt Ví Doanh Thu</h2>
          <p className="text-slate-500 mb-8 max-w-md">
            Ví doanh thu giúp bạn nhận thanh toán từ các khóa học đã bán trên ManabiHub. Hãy thiết lập ví để bắt đầu nhận tiền.
          </p>
          <button 
            onClick={() => window.location.href = '/teacher/kyc'} 
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm"
          >
            Kích hoạt Ví ngay
          </button>
        </div>
      );
    }

    return (
      <div className="p-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">
                Không thể tải thông tin ví doanh thu. Vui lòng thử lại sau.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isWithdrawalDisabled = wallet.walletFrozen || wallet.availableBalance < wallet.minimumPayoutAmount;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Ví doanh thu</h1>
          <p className="text-slate-500 mt-1">Quản lý doanh thu khóa học và yêu cầu rút tiền</p>
        </div>
        <Tooltip title={isWithdrawalDisabled ? "Ví đang bị khóa hoặc số dư không đủ" : ""}>
          <span>
            <button 
              onClick={() => setIsModalOpen(true)}
              disabled={isWithdrawalDisabled}
              className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isWithdrawalDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Yêu cầu Rút tiền
            </button>
          </span>
        </Tooltip>
      </div>

      {wallet.walletFrozen && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Ví đang bị khóa!</strong>
          <span className="block sm:inline"> Ví doanh thu của bạn đang bị tạm khóa. Vui lòng liên hệ bộ phận hỗ trợ để biết thêm chi tiết.</span>
        </div>
      )}

      <WalletBalanceCards wallet={wallet} />

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">Lịch sử rút tiền</h2>
        {isLoadingWithdrawals ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400"></div>
          </div>
        ) : (
          <WithdrawalHistoryTable withdrawals={withdrawalsPage?.content || []} />
        )}
      </div>

      <WithdrawalRequestModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        wallet={wallet}
      />
    </div>
  );
}
