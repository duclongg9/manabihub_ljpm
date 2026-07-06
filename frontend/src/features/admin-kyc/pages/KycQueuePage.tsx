import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminKycService } from '../services/adminKycService';
import { axiosClient } from '../../../shared/api/axiosClient';
import type { KycRequestResponse } from '../services/adminKycService';

export function KycQueuePage() {
  const [queue, setQueue] = useState<KycRequestResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminKycService.getPendingKycQueue()
      .then((data) => {
        setQueue(data);
        setLoading(false);
      })
      .catch((err: any) => {
        if (err.response?.status === 401) {
          setError('401');
        } else {
          setError('Không thể tải hàng đợi KYC. Vui lòng kiểm tra lại kết nối backend.');
        }
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
        <span className="ml-3 text-gray-600 font-medium">Đang tải danh sách chờ duyệt...</span>
      </div>
    );
  }

  if (error === '401') {
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-800 px-6 py-6 rounded-xl shadow-sm text-center max-w-lg mx-auto mt-10">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 text-amber-600 mb-4">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold mb-2">Yêu cầu xác thực</h3>
        <p className="mb-6 text-sm text-amber-700 leading-relaxed">
          Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vì hệ thống JWT chưa được kích hoạt hoàn toàn, vui lòng nhấn nút bên dưới để giả lập đăng nhập (Mock Session) cho Admin.
        </p>
        <button
          onClick={async () => {
            setLoading(true);
            try {
              await axiosClient.post('/v1/demo/login-admin');
              setError(null);
              const data = await adminKycService.getPendingKycQueue();
              setQueue(data);
            } catch (e) {
              setError('Không thể mock login. Vui lòng kiểm tra backend.');
            } finally {
              setLoading(false);
            }
          }}
          className="inline-flex items-center justify-center px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg text-sm shadow transition hover:shadow-md w-full"
        >
          Tạo Mock Session (Đăng nhập Demo)
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-sm">
        <p className="font-semibold">{error}</p>
        <button
          onClick={() => { setLoading(true); setError(null); }}
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
          <h2 className="text-xl font-bold text-gray-900">Danh sách yêu cầu KYC chờ duyệt</h2>
          <p className="text-sm text-gray-500 mt-1">
            Hiển thị các hồ sơ đăng ký tài khoản Giáo viên đang chờ duyệt danh tính.
          </p>
        </div>
        <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1.5 rounded-full border border-amber-200">
          Có {queue.length} hồ sơ chờ duyệt
        </span>
      </div>

      {queue.length === 0 ? (
        <div className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-50 text-green-600 mb-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-gray-600 font-medium">Không có hồ sơ nào đang chờ xét duyệt.</p>
          <p className="text-sm text-gray-400 mt-1">Tất cả hồ sơ đăng ký KYC đều đã được xử lý xong.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100/70 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase tracking-wider">
                <th className="py-4 px-6">Họ và tên hiển thị</th>
                <th className="py-4 px-6">Email giáo viên</th>
                <th className="py-4 px-6">Ngày gửi</th>
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
