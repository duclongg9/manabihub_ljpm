import { useCallback, useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { Link } from 'react-router-dom';
import { adminKycService, KYC_STATUS_LABELS } from '../services/adminKycService';
import type { KycRequestResponse } from '../services/adminKycService';

const STATUS_BADGE_CLASS: Record<string, string> = {
  APPROVED: 'bg-green-50 text-green-700 border-green-200',
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
  CORRECTION_REQUIRED: 'bg-orange-50 text-orange-700 border-orange-200',
  REVOKED: 'bg-gray-200 text-gray-800 border-gray-300',
  DRAFT: 'bg-slate-50 text-slate-600 border-slate-200',
};

export function KycQueuePage() {
  const [queue, setQueue] = useState<KycRequestResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setQueue(await adminKycService.getPendingKycQueue());
    } catch (requestError) {
      setError(
        isAxiosError(requestError) && requestError.response?.status === 401
          ? 'Phiên đăng nhập đã hết hạn. Hệ thống đang chuyển về trang đăng nhập.'
          : 'Không thể tải hàng đợi KYC. Vui lòng kiểm tra lại kết nối backend.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
        <span className="ml-3 text-gray-600 font-medium">Đang tải danh sách chờ duyệt...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-sm">
        <p className="font-semibold">{error}</p>
        <button
          onClick={() => void loadQueue()}
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
          <h2 className="text-xl font-bold text-gray-900">Ngoại lệ KYC cần xử lý</h2>
          <p className="text-sm text-gray-500 mt-1">
            Chỉ hiển thị hồ sơ không thể tự động xác minh. Hồ sơ xác minh thành công không tạo công việc thủ công.
          </p>
        </div>
        <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1.5 rounded-full border border-amber-200">
          Tổng {queue.length} hồ sơ
        </span>
      </div>

      {queue.length === 0 ? (
        <div className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-50 text-green-600 mb-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-gray-600 font-medium">Không có hồ sơ cần xử lý.</p>
          <p className="text-sm text-gray-400 mt-1">
            Hậu kiểm hồ sơ đã duyệt phải bắt đầu từ báo cáo vi phạm hoặc tín hiệu rủi ro có căn cứ.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100/70 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase tracking-wider">
                <th className="py-4 px-6">Họ và tên hiển thị</th>
                <th className="py-4 px-6">Email giáo viên</th>
                <th className="py-4 px-6">Ngày gửi</th>
                <th className="py-4 px-6">Trạng thái</th>
                <th className="py-4 px-6">Xác thực VNPT</th>
                <th className="py-4 px-6">Mức độ rủi ro</th>
                <th className="py-4 px-6 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {queue.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50/50 transition">
                  <td className="py-4 px-6 font-semibold text-gray-900">{req.displayName}</td>
                  <td className="py-4 px-6 text-gray-500">{req.teacherEmail}</td>
                  <td className="py-4 px-6 text-gray-500">
                    {new Date(req.createdAt).toLocaleDateString('vi-VN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                      STATUS_BADGE_CLASS[req.status] || 'bg-gray-50 text-gray-600 border-gray-200'
                    }`}>
                      {KYC_STATUS_LABELS[req.status] || req.status}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                      req.vnptVerificationStatus === 'SUCCESS'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {req.vnptVerificationStatus === 'SUCCESS' ? 'Thành công' : 'Thất bại'}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                      req.riskLevel === 'LOW'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : req.riskLevel === 'MEDIUM'
                        ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {req.riskLevel === 'LOW' ? 'Thấp' : req.riskLevel === 'MEDIUM' ? 'Trung bình' : 'Cao'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <Link
                      to={`/admin/kyc/${req.id}`}
                      className="inline-flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg text-xs shadow-sm transition hover:shadow-md"
                    >
                      Xem chi tiết
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
