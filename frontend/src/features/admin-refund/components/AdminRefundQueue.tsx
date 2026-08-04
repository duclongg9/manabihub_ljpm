import { useCallback, useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { Link } from 'react-router-dom';
import { adminRefundApi } from '../api/adminRefundApi';
import type { RefundMoneyValue, RefundQueueResponse, RefundStatus } from '../types';

const STATUS_LABELS: Record<RefundStatus, string> = {
  PENDING: 'Chờ quyết định',
  PROCESSING: 'Provider đang xử lý',
  APPROVED: 'Đã hoàn tiền',
  REJECTED: 'Đã từ chối',
  RECONCILIATION_REQUIRED: 'Cần đối soát',
  CANCELLED: 'Đã hủy',
};

function formatMoney(value: RefundMoneyValue | null | undefined, currency?: string | null) {
  if (value === null || value === undefined || value === '') return 'Chưa có số tiền';
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return String(value);

  try {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency || 'VND',
      maximumFractionDigits: currency === 'VND' || !currency ? 0 : 2,
    }).format(numericValue);
  } catch {
    return `${numericValue.toLocaleString('vi-VN')} ${currency || 'VND'}`;
  }
}

export function AdminRefundQueue() {
  const [queue, setQueue] = useState<RefundQueueResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const size = 10;

  const loadQueue = useCallback(async (currentPage: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await adminRefundApi.getPendingRefunds(currentPage, size);
      setQueue(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (requestError) {
      setError(
        isAxiosError(requestError) && requestError.response?.status === 401
          ? 'Phiên đăng nhập đã hết hạn. Hệ thống đang chuyển về trang đăng nhập.'
          : 'Không thể tải hàng đợi hoàn tiền. Vui lòng kiểm tra lại kết nối backend.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadQueue(page);
  }, [loadQueue, page]);

  if (loading && queue.length === 0) {
    return (
      <div className="flex min-h-[300px] items-center justify-center" role="status">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-red-600" />
        <span className="ml-3 font-medium text-gray-600">Đang tải hàng đợi hoàn tiền...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 shadow-sm">
        <p className="font-semibold">{error}</p>
        <button
          onClick={() => void loadQueue(page)}
          className="mt-2 text-sm text-red-600 underline hover:text-red-800"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col justify-between gap-3 border-b border-gray-100 bg-gray-50/50 p-6 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Hàng đợi xử lý hoàn tiền</h2>
          <p className="mt-1 text-sm text-gray-500">
            Theo dõi quyết định, trạng thái provider và các yêu cầu cần đối soát.
          </p>
        </div>
        <span className="self-start rounded-full border border-amber-200 bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-800 sm:self-auto">
          {totalElements} yêu cầu cần theo dõi
        </span>
      </div>

      {queue.length === 0 ? (
        <div className="p-12 text-center">
          <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-600">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="font-medium text-gray-600">Không có yêu cầu hoàn tiền cần theo dõi.</p>
        </div>
      ) : (
        <div className="relative overflow-x-auto">
          {loading && (
            <div
              className="absolute inset-0 z-10 flex items-center justify-center bg-white/60"
              role="status"
              aria-label="Đang tải trang"
            >
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-red-600" />
            </div>
          )}
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-100/70 text-xs font-bold uppercase tracking-wider text-gray-600">
                <th className="px-6 py-4">Đơn hàng / khóa học</th>
                <th className="px-6 py-4">Học viên</th>
                <th className="px-6 py-4">Số tiền</th>
                <th className="px-6 py-4">Thanh toán</th>
                <th className="px-6 py-4">Trạng thái refund</th>
                <th className="px-6 py-4">Ngày gửi</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {queue.map((request) => (
                <tr key={request.id} className="transition hover:bg-gray-50/50">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">{request.orderCode}</div>
                    <div className="mt-1 max-w-[220px] truncate text-xs text-gray-600" title={request.courseTitle || request.reason}>
                      {request.courseTitle || request.reason}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{request.studentName}</div>
                    <div className="text-xs text-gray-500">{request.studentEmail}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 font-semibold text-gray-900">
                    {formatMoney(request.grossAmount ?? request.paymentAmount, request.currency)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{request.paymentStatus || 'Chưa có'}</div>
                    <div className="text-xs text-gray-500">
                      {request.paymentProvider || 'Chưa xác định provider'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{STATUS_LABELS[request.status]}</div>
                    <div className="text-xs text-gray-500">
                      Provider: {request.providerStatus || 'Chưa gửi'}
                    </div>
                    {request.reconciliationReasonCode && (
                      <div className="mt-1 text-xs font-medium text-orange-700">
                        {request.reconciliationReasonCode}
                      </div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-gray-500">
                    {new Date(request.createdAt).toLocaleString('vi-VN')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      to={`/admin/refunds/${request.id}`}
                      className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-red-700 hover:shadow-md"
                    >
                      Xem chi tiết
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50/50 p-4">
            <span className="text-sm text-gray-700">
              Trang <span className="font-semibold text-gray-900">{page + 1}</span>
              {' / '}
              <span className="font-semibold text-gray-900">{Math.max(totalPages, 1)}</span>
            </span>
            <div className="inline-flex space-x-2">
              <button
                onClick={() => setPage((previousPage) => Math.max(previousPage - 1, 0))}
                disabled={page === 0 || loading}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Trước
              </button>
              <button
                onClick={() => setPage((previousPage) => Math.min(previousPage + 1, totalPages - 1))}
                disabled={page >= totalPages - 1 || loading}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
