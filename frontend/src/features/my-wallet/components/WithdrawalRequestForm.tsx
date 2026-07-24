import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import type { WithdrawalFormValues } from '../schemas/withdrawalSchema';
import { formatCurrency } from '../../../shared/utils/formatCurrency';
import type { TeacherWallet, TeacherBankAccount } from '../types/wallet.types';
import { walletService } from '../services/walletService';
import { useQuery, useMutation } from '@tanstack/react-query';

const BANK_LIST = [
  { code: 'VCB', name: 'Vietcombank - Ngân hàng TMCP Ngoại thương VN' },
  { code: 'TCB', name: 'Techcombank - Ngân hàng TMCP Kỹ thương VN' },
  { code: 'MB', name: 'MBBank - Ngân hàng TMCP Quân đội' },
  { code: 'VPB', name: 'VPBank - Ngân hàng TMCP Việt Nam Thịnh Vượng' },
  { code: 'CTG', name: 'VietinBank - Ngân hàng TMCP Công thương VN' },
  { code: 'BIDV', name: 'BIDV - Ngân hàng TMCP Đầu tư và Phát triển VN' },
  { code: 'ACB', name: 'ACB - Ngân hàng TMCP Á Châu' },
  { code: 'STB', name: 'Sacombank - Ngân hàng TMCP Sài Gòn Thương Tín' },
  { code: 'TPB', name: 'TPBank - Ngân hàng TMCP Tiên Phong' },
  { code: 'VIB', name: 'VIB - Ngân hàng TMCP Quốc tế VN' },
];

interface WithdrawalRequestFormProps {
  wallet: TeacherWallet;
  onSubmit: (values: WithdrawalFormValues & { otpCode: string, saveAccount: boolean }) => void;
  isSubmitting: boolean;
}

export function WithdrawalRequestForm({ wallet, onSubmit, isSubmitting }: WithdrawalRequestFormProps) {
  const { data: savedAccountsResponse, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['savedBankAccounts'],
    queryFn: () => walletService.getSavedBankAccounts(),
  });
  
  const savedAccounts = savedAccountsResponse?.data || [];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<WithdrawalFormValues>({
    defaultValues: {
      amount: undefined,
      useNewAccount: true,
      bankCode: '',
      bankName: '',
      accountNumber: '',
      accountHolderName: '',
      branch: '',
    },
  });

  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [useNewAccount, setUseNewAccount] = useState<boolean>(true);

  // When saved accounts load, default to first one if exists
  useEffect(() => {
    if (savedAccounts.length > 0) {
      setUseNewAccount(false);
      handleSelectAccount(savedAccounts[0].id);
    }
  }, [savedAccounts.length]);

  const handleSelectAccount = (id: string) => {
    setSelectedAccountId(id);
    const acc = savedAccounts.find(a => a.id === id);
    if (acc) {
      setValue('bankCode', acc.bankCode);
      setValue('bankName', acc.bankName);
      setValue('accountNumber', acc.accountNumber);
      setValue('accountHolderName', acc.accountHolderName);
    }
  };

  const amount = watch('amount');
  const bankCode = watch('bankCode');
  const accountNumber = watch('accountNumber');
  const amountNum = Number(amount) || 0;
  
  const [isCheckingBank, setIsCheckingBank] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [pendingValues, setPendingValues] = useState<WithdrawalFormValues | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [saveAccount, setSaveAccount] = useState(true);

  const { mutate: sendOtp, isPending: isSendingOtp } = useMutation({
    mutationFn: () => walletService.sendWithdrawalOtp(),
    onSuccess: () => {
      toast.success('Mã OTP đã được gửi đến thiết bị của bạn');
      setCountdown(60);
    },
    onError: () => {
      toast.error('Không thể gửi mã OTP, vui lòng thử lại');
      setShowOtp(false);
    }
  });

  useEffect(() => {
    let timer: any;
    if (showOtp && countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [showOtp, countdown]);

  const isExceedBalance = amountNum > wallet.availableBalance;
  const isBelowMinimum = amountNum > 0 && amountNum < wallet.minimumPayoutAmount;
  const isDisabled = isSubmitting || isExceedBalance || isBelowMinimum || amountNum <= 0;

  const handleCheckBank = () => {
    if (!bankCode || !accountNumber) {
      toast.error('Vui lòng chọn Ngân hàng và Số tài khoản trước khi kiểm tra.');
      return;
    }
    setIsCheckingBank(true);
    setTimeout(() => {
      setValue('accountHolderName', 'NGUYEN VAN A (Đã xác thực)', { shouldValidate: true });
      setIsCheckingBank(false);
      toast.success('Xác thực tài khoản thành công!');
    }, 1000);
  };

  const onPreSubmit = (values: WithdrawalFormValues) => {
    setPendingValues(values);
    setOtpCode('');
    setShowOtp(true);
    sendOtp();
  };

  const handleConfirmOtp = () => {
    if (otpCode.length !== 6) {
      toast.error('Mã OTP phải gồm 6 chữ số');
      return;
    }
    setShowOtp(false);
    if (pendingValues) {
      onSubmit({
        ...pendingValues,
        otpCode,
        saveAccount: useNewAccount ? saveAccount : false
      });
    }
  };

  return (
    <>
    <form onSubmit={handleSubmit(onPreSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Số tiền rút (VND)
          </label>
          <input
            type="number"
            {...register('amount', { valueAsNumber: true, required: 'Vui lòng nhập số tiền', min: { value: 1, message: 'Số tiền phải lớn hơn 0' } })}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.amount ? 'border-red-500' : 'border-slate-300'}`}
            placeholder="Nhập số tiền..."
          />
          {errors.amount && (
            <p className="mt-1 text-sm text-red-600">{errors.amount.message as string}</p>
          )}
          <p className="text-sm text-slate-500 mt-1">
            Khả dụng: <span className="font-semibold text-slate-900">{formatCurrency(wallet.availableBalance)}</span>
          </p>
        </div>

        {isExceedBalance && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline"> Số tiền yêu cầu vượt quá số dư khả dụng.</span>
          </div>
        )}

        {isBelowMinimum && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline"> Số tiền tối thiểu một lần rút là {formatCurrency(wallet.minimumPayoutAmount)}.</span>
          </div>
        )}
      </div>

      <div className="border-t pt-4">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-medium text-sm">Thông tin nhận tiền</h4>
          {savedAccounts.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setUseNewAccount(!useNewAccount);
                if (useNewAccount && savedAccounts.length > 0) {
                  handleSelectAccount(savedAccounts[0].id);
                } else {
                  setValue('bankCode', '');
                  setValue('bankName', '');
                  setValue('accountNumber', '');
                  setValue('accountHolderName', '');
                }
              }}
              className="text-sm text-blue-600 hover:underline"
            >
              {useNewAccount ? 'Chọn tài khoản đã lưu' : 'Dùng tài khoản mới'}
            </button>
          )}
        </div>

        {!useNewAccount && savedAccounts.length > 0 ? (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">Tài khoản đã lưu</label>
            <select
              value={selectedAccountId}
              onChange={(e) => handleSelectAccount(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {savedAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.bankCode} - {acc.accountNumber} - {acc.accountHolderName}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ngân hàng</label>
              <Controller
                name="bankCode"
                control={control}
                rules={{ required: 'Vui lòng chọn ngân hàng' }}
                render={({ field }) => (
                  <select
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      const bank = BANK_LIST.find(b => b.code === e.target.value);
                      if (bank) setValue('bankName', bank.name);
                    }}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.bankCode ? 'border-red-500' : 'border-slate-300'}`}
                  >
                    <option value="">-- Chọn ngân hàng --</option>
                    {BANK_LIST.map(bank => (
                      <option key={bank.code} value={bank.code}>
                        {bank.code} - {bank.name}
                      </option>
                    ))}
                  </select>
                )}
              />
              {errors.bankCode && (
                <p className="mt-1 text-sm text-red-600">{errors.bankCode.message as string}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Số tài khoản</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  {...register('accountNumber', { required: 'Vui lòng nhập số tài khoản' })}
                  className={`flex-1 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.accountNumber ? 'border-red-500' : 'border-slate-300'}`}
                  placeholder="Nhập số tài khoản"
                />
                <button
                  type="button"
                  onClick={handleCheckBank}
                  disabled={isCheckingBank || !bankCode || !accountNumber}
                  className="px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50"
                >
                  {isCheckingBank ? 'Đang tra cứu...' : 'Kiểm tra'}
                </button>
              </div>
              {errors.accountNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.accountNumber.message as string}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tên chủ tài khoản</label>
              <input
                type="text"
                {...register('accountHolderName', { required: 'Vui lòng nhập tên chủ tài khoản' })}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.accountHolderName ? 'border-red-500' : 'border-slate-300'}`}
                placeholder="VD: NGUYEN VAN A"
              />
              {errors.accountHolderName && (
                <p className="mt-1 text-sm text-red-600">{errors.accountHolderName.message as string}</p>
              )}
            </div>

            <div className="mt-4 flex items-center">
              <input
                id="save-account"
                type="checkbox"
                checked={saveAccount}
                onChange={(e) => setSaveAccount(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="save-account" className="ml-2 block text-sm text-gray-900">
                Lưu thông tin tài khoản cho lần rút sau
              </label>
            </div>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isDisabled}
        className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isSubmitting ? 'Đang xử lý...' : 'Gửi yêu cầu rút tiền'}
      </button>
    </form>

    <Dialog open={showOtp} onClose={() => setShowOtp(false)} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold' }}>Xác thực OTP</DialogTitle>
      <DialogContent>
        <div className="flex flex-col items-center mt-2">
          <p className="text-sm text-slate-500 text-center mb-6">
            Mã xác thực 6 số đã được gửi về email của bạn. Vui lòng kiểm tra hộp thư.
          </p>
          <input
            type="text"
            className="w-48 px-4 py-3 text-center text-2xl tracking-[0.75em] font-mono border-2 rounded-lg shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="------"
            maxLength={6}
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
            autoFocus
          />
          <div className="mt-6 text-sm">
            {countdown > 0 ? (
              <span className="text-slate-500">Gửi lại mã sau <span className="font-semibold text-blue-600">{countdown}s</span></span>
            ) : (
              <button 
                type="button" 
                onClick={() => sendOtp()}
                disabled={isSendingOtp}
                className="text-blue-600 font-medium hover:underline focus:outline-none disabled:opacity-50"
              >
                {isSendingOtp ? 'Đang gửi...' : 'Gửi lại mã OTP'}
              </button>
            )}
          </div>
        </div>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'center', gap: 2 }}>
        <Button onClick={() => setShowOtp(false)} variant="outlined" color="inherit" sx={{ width: '120px' }}>
          Hủy
        </Button>
        <Button 
          onClick={handleConfirmOtp} 
          variant="contained" 
          color="primary" 
          disabled={otpCode.length !== 6 || isSubmitting}
          sx={{ width: '120px' }}
        >
          {isSubmitting ? 'Đang gửi...' : 'Xác nhận'}
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
}
