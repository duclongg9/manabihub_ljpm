import { useEffect, useState } from 'react';
import { getStudentWallet, topUpWallet } from '../services/studentWalletService';
import type { StudentWalletResponse } from '../types';

const MIN_TOPUP = 10000;
const QUICK_AMOUNTS = [50000, 100000, 200000, 500000];

export const StudentWalletPage = () => {
  const [wallet, setWallet] = useState<StudentWalletResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState<number>(100000);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getStudentWallet()
      .then((data) => active && setWallet(data))
      .catch(() => active && setError('Không tải được số dư ví.'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const handleTopUp = async () => {
    if (!amount || amount < MIN_TOPUP || !Number.isInteger(amount)) {
      setError(`Số tiền nạp phải là số nguyên và tối thiểu ${MIN_TOPUP.toLocaleString('vi-VN')}đ.`);
      return;
    }
    setProcessing(true);
    setError(null);
    try {
      const checkout = await topUpWallet(amount);
      if (checkout.paymentUrl) {
        window.location.href = checkout.paymentUrl;
      } else {
        setError('Không tạo được liên kết thanh toán. Vui lòng thử lại.');
        setProcessing(false);
      }
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(message || 'Không thể tạo yêu cầu nạp tiền. Vui lòng thử lại.');
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-extrabold text-slate-900 mb-6">Ví của tôi</h1>

      {/* Balance card */}
      <div className="bg-gradient-to-br from-red-600 to-rose-700 text-white rounded-2xl p-6 shadow-lg mb-8">
        <p className="text-sm opacity-90">Số dư khả dụng</p>
        <p className="text-4xl font-extrabold mt-1">
          {loading ? '…' : `${(wallet?.availableBalance ?? 0).toLocaleString('vi-VN')} ${wallet?.currency ?? 'VND'}`}
        </p>
      </div>

      {/* Top-up */}
      <div className="bg-white rounded-2xl shadow border border-slate-200/60 p-6">
        <h2 className="font-bold text-slate-900 mb-4">Nạp tiền vào ví</h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {QUICK_AMOUNTS.map((value) => (
            <button
              key={value}
              onClick={() => setAmount(value)}
              className={`py-2.5 rounded-xl font-semibold border transition-colors ${
                amount === value
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-red-400'
              }`}
            >
              {value.toLocaleString('vi-VN')}đ
            </button>
          ))}
        </div>

        <label className="block text-sm text-slate-600 mb-1">Hoặc nhập số tiền (VND)</label>
        <input
          type="number"
          min={MIN_TOPUP}
          step={1000}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full border border-slate-300 rounded-xl px-4 py-3 mb-2 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
        />
        <p className="text-xs text-slate-400 mb-4">Tối thiểu {MIN_TOPUP.toLocaleString('vi-VN')}đ.</p>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <button
          onClick={handleTopUp}
          disabled={processing}
          className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors"
        >
          {processing ? 'Đang chuyển đến cổng thanh toán…' : 'Nạp tiền qua VNPay'}
        </button>
        <p className="text-center text-xs text-slate-400 mt-3">
          Giao dịch chỉ được xác nhận qua cổng thanh toán (webhook), không qua trình duyệt.
        </p>
      </div>
    </div>
  );
};

export default StudentWalletPage;
