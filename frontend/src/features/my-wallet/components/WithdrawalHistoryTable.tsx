import type { WithdrawalRequest } from '../types/wallet.types';
import { WithdrawalStatusBadge } from './WithdrawalStatusBadge';
import { formatCurrency } from '../../../shared/utils/formatCurrency';
import { useCancelWithdrawal } from '../hooks/useCancelWithdrawal';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button } from '@mui/material';

interface WithdrawalHistoryTableProps {
  withdrawals: WithdrawalRequest[];
}

export function WithdrawalHistoryTable({ withdrawals }: WithdrawalHistoryTableProps) {
  const { mutate: cancelWithdrawal, isPending } = useCancelWithdrawal();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleOpenDialog = (id: string) => {
    setSelectedId(id);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedId(null);
  };

  const handleConfirmCancel = () => {
    if (!selectedId) return;
    setCancellingId(selectedId);
    cancelWithdrawal(selectedId, {
      onSuccess: () => {
        toast.success('Hủy lệnh thành công');
        setCancellingId(null);
        handleCloseDialog();
      },
      onError: () => {
        toast.error('Hủy lệnh thất bại, vui lòng thử lại');
        setCancellingId(null);
        handleCloseDialog();
      }
    });
  };

  if (!withdrawals || withdrawals.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 border rounded-lg border-slate-200 bg-white">
        Chưa có yêu cầu rút tiền nào.
      </div>
    );
  }

  return (
    <div className="rounded-md border border-slate-200 bg-white overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-6 py-3 font-medium whitespace-nowrap">Mã Y/C</th>
            <th className="px-6 py-3 font-medium whitespace-nowrap">Ngày yêu cầu</th>
            <th className="px-6 py-3 font-medium whitespace-nowrap">Số tiền (VND)</th>
            <th className="px-6 py-3 font-medium whitespace-nowrap">Ngân hàng</th>
            <th className="px-6 py-3 font-medium whitespace-nowrap">Số tài khoản</th>
            <th className="px-6 py-3 font-medium whitespace-nowrap">Trạng thái</th>
            <th className="px-6 py-3 font-medium text-right whitespace-nowrap">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {withdrawals.map((item) => (
            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 font-medium text-slate-600 whitespace-nowrap">
                {item.id.substring(0, 8)}...
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {new Date(item.requestedAt).toLocaleString('vi-VN')}
              </td>
              <td className="px-6 py-4 font-semibold text-slate-900 whitespace-nowrap">
                {formatCurrency(item.requestedAmount)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">{item.bankName}</td>
              <td className="px-6 py-4 whitespace-nowrap">{item.accountNumberMasked}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <WithdrawalStatusBadge status={item.status} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right">
                {item.status === 'PENDING' && (
                  <button
                    onClick={() => handleOpenDialog(item.id)}
                    disabled={isPending && cancellingId === item.id}
                    className="text-red-600 hover:text-red-900 font-medium text-sm disabled:opacity-50"
                  >
                    {isPending && cancellingId === item.id ? 'Đang hủy...' : 'Hủy lệnh'}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Xác nhận hủy lệnh rút tiền
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Bạn có chắc chắn muốn hủy lệnh rút tiền này không? Số tiền đang bị khóa sẽ được cộng lại vào số dư khả dụng ngay lập tức.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">
            Đóng
          </Button>
          <Button onClick={handleConfirmCancel} color="error" variant="contained" autoFocus disabled={isPending}>
            {isPending ? 'Đang xử lý...' : 'Xác nhận hủy'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
