import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminRefundApi } from '../api/adminRefundApi';
import type { RefundDetailResponse } from '../types';
import { RefundDecisionForm } from './RefundDecisionForm';

export function AdminRefundDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<RefundDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [decisionAction, setDecisionAction] = useState<'approve' | 'reject' | null>(null);

  const loadDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await adminRefundApi.getRefundDetail(id);
      setDetail(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải thông tin chi tiết hoàn tiền.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  const handleDecision = async (note: string) => {
    if (!id || !decisionAction) return;
    try {
      if (decisionAction === 'approve') {
        await adminRefundApi.approveRefund(id, { note });
      } else {
        await adminRefundApi.rejectRefund(id, { note });
      }
      setDecisionAction(null);
      void loadDetail();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi xử lý.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-lg">
        <p>{error}</p>
        <button onClick={() => navigate('/admin/refunds')} className="mt-2 text-red-600 underline text-sm">
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate('/admin/refunds')}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center mb-2"
          >
            ← Quay lại
          </button>
          <h2 className="text-2xl font-bold text-gray-900">Chi tiết hoàn tiền: {detail.orderCode}</h2>
        </div>
        {detail.status === 'PENDING' && (
          <div className="flex space-x-3">
            <button
              onClick={() => setDecisionAction('reject')}
              className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 font-medium rounded-lg transition"
            >
              Từ chối
            </button>
            <button
              onClick={() => setDecisionAction('approve')}
              className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 font-medium rounded-lg transition"
            >
              Chấp thuận
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Thông tin yêu cầu</h3>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
            <div>
              <dt className="text-sm font-medium text-gray-500">Mã đơn hàng</dt>
              <dd className="mt-1 text-sm text-gray-900 font-semibold">{detail.orderCode}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Trạng thái</dt>
              <dd className="mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                  detail.status === 'APPROVED' ? 'bg-green-50 text-green-700 border-green-200' :
                  detail.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' :
                  'bg-yellow-50 text-yellow-700 border-yellow-200'
                }`}>
                  {detail.status}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Học viên</dt>
              <dd className="mt-1 text-sm text-gray-900">{detail.studentName} ({detail.studentEmail})</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Ngày yêu cầu</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(detail.createdAt).toLocaleString('vi-VN')}
              </dd>
            </div>
            <div className="md:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Lý do hoàn tiền</dt>
              <dd className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-100">
                {detail.reason}
              </dd>
            </div>
            {detail.status !== 'PENDING' && detail.decisionNote && (
              <div className="md:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Ghi chú quyết định</dt>
                <dd className="mt-1 text-sm text-gray-900 bg-blue-50 p-3 rounded-lg border border-blue-100">
                  {detail.decisionNote}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {decisionAction && (
        <RefundDecisionForm
          action={decisionAction}
          onConfirm={handleDecision}
          onCancel={() => setDecisionAction(null)}
        />
      )}
    </div>
  );
}
