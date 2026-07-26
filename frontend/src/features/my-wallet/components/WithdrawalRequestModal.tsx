import { useEffect } from 'react';
import type { TeacherWallet } from '../types/wallet.types';
import { WithdrawalRequestForm } from './WithdrawalRequestForm';
import type { WithdrawalFormValues } from '../schemas/withdrawalSchema';
import { useCreateWithdrawal } from '../hooks/useCreateWithdrawal';

interface WithdrawalRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: TeacherWallet;
}

import toast from 'react-hot-toast';

export function WithdrawalRequestModal({ isOpen, onClose, wallet }: WithdrawalRequestModalProps) {
  const { mutate: createWithdrawal, isPending } = useCreateWithdrawal();

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (values: WithdrawalFormValues & { otpCode: string, saveAccount: boolean }) => {
    createWithdrawal({
      amount: values.amount,
      bankAccount: {
        bankCode: values.bankCode || '',
        bankName: values.bankName || '',
        accountNumber: values.accountNumber || '',
        accountHolderName: values.accountHolderName || '',
        branch: values.branch,
      },
      otpCode: values.otpCode,
      saveAccount: values.saveAccount,
    }, {
      onSuccess: () => {
        toast.success('Gửi yêu cầu rút tiền thành công!');
        onClose();
      },
      onError: (error: any) => {
        const messageCode = error.response?.data?.messageCode;
        let errorMessage = 'Không thể tạo yêu cầu rút tiền. Vui lòng thử lại.';
        
        switch (messageCode) {
          case 'WALLET_INSUFFICIENT_BALANCE':
            errorMessage = 'Số dư khả dụng không đủ để thực hiện yêu cầu.';
            break;
          case 'WALLET_FROZEN':
            errorMessage = 'Ví doanh thu đang bị tạm khóa do vi phạm hoặc đang chờ xử lý.';
            break;
          case 'PAYOUT_AMOUNT_BELOW_MINIMUM':
            errorMessage = 'Số tiền rút chưa đạt mức tối thiểu.';
            break;
          case 'PAYOUT_PENDING_REQUEST_EXISTS':
            errorMessage = 'Bạn đang có một lệnh rút tiền chờ xử lý. Vui lòng chờ hoàn tất hoặc hủy lệnh cũ.';
            break;
          case 'PAYOUT_MONTHLY_LIMIT_EXCEEDED':
            errorMessage = 'Bạn đã vượt quá giới hạn 2 lần rút tiền trong tháng.';
            break;
        }
        
        toast.error(errorMessage);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="relative bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg w-full">
        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div className="sm:flex sm:items-start">
            <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
              <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                Yêu cầu rút tiền
              </h3>
              <div className="mt-2 mb-4">
                <p className="text-sm text-gray-500">
                  Điền thông tin tài khoản ngân hàng để nhận thanh toán. Thời gian xử lý từ 3-5 ngày làm việc.
                </p>
              </div>
              
              <WithdrawalRequestForm 
                wallet={wallet} 
                onSubmit={handleSubmit} 
                isSubmitting={isPending} 
              />
              
            </div>
          </div>
        </div>
        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button
            type="button"
            onClick={onClose}
            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
          >
            Hủy / Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
