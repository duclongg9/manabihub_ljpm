import { useCallback, useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { Link } from 'react-router-dom';
import { adminRefundApi } from '../api/adminRefundApi';
import type { RefundQueueResponse } from '../types';

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
  }, [size]);

  useEffect(() => {
    void loadQueue(page);
  }, [loadQueue, page]);

  if (loading && queue.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
        <span className="ml-3 text-gray-600 font-medium">Đang tải danh sách chờ xử lý...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-sm">
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Danh sách yêu cầu hoàn tiền chờ xử lý</h2>
          <p className="text-sm text-gray-500 mt-1">
            Hiển thị các yêu cầu hoàn tiền khóa học đang chờ xem xét.
          </p>
        </div>
        <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1.5 rounded-full border border-amber-200">
          Có {totalElements} yêu cầu chờ duyệt
        </span>
      </div>

      {queue.length === 0 ? (
        <div className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-50 text-green-600 mb-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-gray-600 font-medium">Không có yêu cầu nào đang chờ xét duyệt.</p>
          <p className="text-sm text-gray-400 mt-1">Tất cả yêu cầu hoàn tiền đều đã được xử lý xong.</p>
        </div>
      ) : (
        <div className="overflow-x-auto relative">
          {loading && (
            <div className="absolute inset-0 bg-white/50 flex justify-center items-center z-10">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            </div>
          )}
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100/70 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase tracking-wider">
                <th className="py-4 px-6">Mã đơn hàng</th>
                <th className="py-4 px-6">Tên học viên</th>
                <th className="py-4 px-6">Lý do</th>
                <th className="py-4 px-6">Ngày gửi</th>
                <th className="py-4 px-6 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {queue.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50/50 transition">
                  <td className="py-4 px-6 font-semibold text-gray-900">{req.orderCode}</td>
                  <td className="py-4 px-6">
                    <div className="font-medium text-gray-900">{req.studentName}</div>
                    <div className="text-gray-500 text-xs">{req.studentEmail}</div>
                  </td>
                  <td className="py-4 px-6 text-gray-600 max-w-[200px] truncate" title={req.reason}>
                    {req.reason}
                  </td>
                  <td className="py-4 px-6 text-gray-500">
                    {new Date(req.createdAt).toLocaleDateString('vi-VN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <Link
                      to={`/admin/refunds/${req.id}`}
                      className="inline-flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg text-xs shadow-sm transition hover:shadow-md"
                    >
                      Xem chi tiết
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="p-4 border-t border-gray-200 flex justify-between items-center bg-gray-50/50">
             <span className="text-sm text-gray-700">
                Hiển thị trang <span className="font-semibold text-gray-900">{page + 1}</span> trên <span className="font-semibold text-gray-900">{totalPages}</span>
             </span>
             <div className="inline-flex mt-2 xs:mt-0 space-x-2">
                <button
                   onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                   disabled={page === 0 || loading}
                   className="flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                   Trước
                </button>
                <button
                   onClick={() => setPage((prev) => Math.min(prev + 1, totalPages - 1))}
                   disabled={page >= totalPages - 1 || loading}
                   className="flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
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
