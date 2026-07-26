import type { WithdrawalStatus } from '../types/wallet.types';

interface WithdrawalStatusBadgeProps {
  status: WithdrawalStatus;
}

const STATUS_CONFIG: Record<WithdrawalStatus, { label: string; color: string }> = {
  PENDING: { label: 'Chờ duyệt', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  APPROVED: { label: 'Đã duyệt', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  REJECTED: { label: 'Từ chối', color: 'bg-red-100 text-red-800 border-red-200' },
  EXECUTED: { label: 'Đã chuyển khoản', color: 'bg-green-100 text-green-800 border-green-200' },
  FAILED: { label: 'Thất bại', color: 'bg-red-100 text-red-800 border-red-200' },
  CANCELLED: { label: 'Đã hủy', color: 'bg-slate-100 text-slate-800 border-slate-200' },
};

export function WithdrawalStatusBadge({ status }: WithdrawalStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  
  if (!config) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        {status}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}
