import { formatCurrency } from '../../../shared/utils/formatCurrency';
import type { TeacherWallet } from '../types/wallet.types';

interface WalletBalanceCardsProps {
  wallet: TeacherWallet;
}

export function WalletBalanceCards({ wallet }: WalletBalanceCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3 mb-8">
      <div className="border border-slate-200 shadow-sm rounded-lg bg-white">
        <div className="p-6">
          <div className="text-sm font-medium text-slate-500 mb-1">Số dư khả dụng</div>
          <div className="text-3xl font-bold text-slate-900">
            {formatCurrency(wallet.availableBalance)}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Đã sẵn sàng để rút
          </p>
        </div>
      </div>
      
      <div className="border border-slate-200 shadow-sm rounded-lg bg-white">
        <div className="p-6">
          <div className="text-sm font-medium text-slate-500 mb-1">Doanh thu chờ đối soát</div>
          <div className="text-3xl font-bold text-slate-900">
            {formatCurrency(wallet.pendingBalance)}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Sẽ khả dụng sau {wallet.clearingPeriodDays} ngày kể từ lúc phát sinh
          </p>
        </div>
      </div>

      <div className="border border-slate-200 shadow-sm rounded-lg bg-white">
        <div className="p-6">
          <div className="text-sm font-medium text-slate-500 mb-1">Đang chờ rút</div>
          <div className="text-3xl font-bold text-slate-900">
            {formatCurrency(wallet.reservedBalance || 0)}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Số tiền đang chờ duyệt thanh toán
          </p>
        </div>
      </div>
    </div>
  );
}
