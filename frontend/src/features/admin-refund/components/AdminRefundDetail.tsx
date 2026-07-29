import { useCallback, useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import type { ApiResponse } from '../../../shared/types/api';
import { adminRefundApi } from '../api/adminRefundApi';
import type {
  RefundDecisionRequest,
  RefundDetailResponse,
  RefundMoneyValue,
  RefundStatus,
} from '../types';
import { RefundDecisionForm } from './RefundDecisionForm';

const STATUS_META: Record<RefundStatus, { label: string; className: string }> = {
  PENDING: {
    label: 'Chờ quyết định',
    className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  },
  PROCESSING: {
    label: 'Đang gửi yêu cầu hoàn tiền',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  APPROVED: {
    label: 'Đã hoàn tiền',
    className: 'bg-green-50 text-green-700 border-green-200',
  },
  REJECTED: {
    label: 'Đã từ chối',
    className: 'bg-red-50 text-red-700 border-red-200',
  },
  RECONCILIATION_REQUIRED: {
    label: 'Cần đối soát',
    className: 'bg-orange-50 text-orange-800 border-orange-200',
  },
  CANCELLED: {
    label: 'Đã hủy',
    className: 'bg-gray-50 text-gray-700 border-gray-200',
  },
};

const EVIDENCE_LABELS: Record<string, string> = {
  eligible: 'Đủ điều kiện',
  eligibilityResult: 'Kết quả điều kiện',
  refundWindowDays: 'Thời hạn hoàn tiền (ngày)',
  daysSincePurchase: 'Số ngày từ khi mua',
  progressPercent: 'Tiến độ học',
  progressLimitPercent: 'Ngưỡng tiến độ',
  protectedContentConsumed: 'Đã dùng nội dung được bảo vệ',
  manualReviewReason: 'Lý do chuyển duyệt thủ công',
  exceptionReasonCode: 'Mã ngoại lệ',
  evaluatedAt: 'Thời điểm đánh giá',
};

interface DecisionNotice {
  tone: 'success' | 'error';
  message: string;
}

function formatMoney(value: RefundMoneyValue | null | undefined, currency?: string | null) {
  if (value === null || value === undefined || value === '') return 'Chưa có';
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

function formatDate(value?: string | null) {
  if (!value) return 'Chưa có';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('vi-VN');
}

function formatEvidenceValue(value: unknown) {
  if (value === null || value === undefined || value === '') return 'Chưa có';
  if (typeof value === 'boolean') return value ? 'Có' : 'Không';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function EvidenceSnapshot({ snapshot }: { snapshot?: Record<string, unknown> | null }) {
  const entries = snapshot ? Object.entries(snapshot) : [];

  if (entries.length === 0) {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        Chưa có bản chụp điều kiện hoàn tiền. Không nên chấp thuận trước khi backend cung cấp
        bằng chứng bất biến.
      </p>
    );
  }

  return (
    <dl className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {entries.map(([key, value]) => (
        <div key={key} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
          <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
            {EVIDENCE_LABELS[key] || key}
          </dt>
          <dd className="mt-1 break-words text-sm text-gray-900">{formatEvidenceValue(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

export function AdminRefundDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<RefundDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [decisionAction, setDecisionAction] = useState<'approve' | 'reject' | null>(null);
  const [decisionNotice, setDecisionNotice] = useState<DecisionNotice | null>(null);

  const loadDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await adminRefundApi.getRefundDetail(id);
      setDetail(data);
    } catch (requestError) {
      setError(
        isAxiosError(requestError) && requestError.response?.data?.message
          ? requestError.response.data.message
          : 'Không thể tải thông tin chi tiết hoàn tiền.',
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  const handleDecision = async (request: RefundDecisionRequest) => {
    if (!id || !decisionAction) return;
    setDecisionNotice(null);

    try {
      if (decisionAction === 'approve') {
        await adminRefundApi.approveRefund(id, request);
      } else {
        await adminRefundApi.rejectRefund(id, request);
      }

      const completedAction = decisionAction;
      setDecisionAction(null);
      setDecisionNotice({
        tone: 'success',
        message:
          completedAction === 'approve'
            ? 'Provider đã xác nhận và khoản hoàn tiền đã được hạch toán thành công.'
            : 'Đã ghi nhận quyết định từ chối.',
      });
      await loadDetail();
    } catch (requestError) {
      const apiError = isAxiosError<ApiResponse<unknown>>(requestError)
        ? requestError.response
        : undefined;
      const reconciliationRequired =
        apiError?.data?.messageCode === 'REFUND_RECONCILIATION_REQUIRED';
      if (reconciliationRequired) {
        setDecisionAction(null);
        setDecisionNotice({
          tone: 'error',
          message:
            'Chưa thể hoàn tất tự động. Yêu cầu đã được chuyển sang đối soát và không bị ghi nhận hoàn tiền thành công.',
        });
        await loadDetail();
        return;
      }
      const message =
        apiError?.status === 409
          ? 'Yêu cầu đã được người khác xử lý hoặc trạng thái đã thay đổi. Hãy tải lại dữ liệu trước khi quyết định.'
          : apiError?.data?.message
            ? apiError.data.message
            : 'Không thể ghi nhận quyết định. Không có thay đổi nào được xác nhận.';
      setDecisionNotice({ tone: 'error', message });
      if (apiError?.status === 409) {
        setDecisionAction(null);
        await loadDetail();
      }
    }
  };

  if (loading && !detail) {
    return (
      <div className="flex min-h-[300px] items-center justify-center" role="status">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-red-600" />
        <span className="sr-only">Đang tải chi tiết hoàn tiền</span>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">
        <p>{error || 'Không tìm thấy yêu cầu hoàn tiền.'}</p>
        <button
          onClick={() => navigate('/admin/refunds')}
          className="mt-2 text-sm text-red-600 underline"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const statusMeta = STATUS_META[detail.status];
  const hasEligibilityEvidence =
    Boolean(detail.eligibilitySnapshot) &&
    Object.keys(detail.eligibilitySnapshot || {}).length > 0;
  const retryableReconciliation =
    detail.status === 'RECONCILIATION_REQUIRED' &&
    detail.providerStatus !== 'SUCCESS';
  const canDecide =
    detail.status === 'PENDING' || retryableReconciliation;
  const canApprove =
    canDecide &&
    hasEligibilityEvidence &&
    detail.paymentStatus === 'SUCCESS';

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <button
            onClick={() => navigate('/admin/refunds')}
            className="mb-2 flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            ← Quay lại
          </button>
          <h2 className="text-2xl font-bold text-gray-900">Chi tiết hoàn tiền: {detail.orderCode}</h2>
        </div>
        {canDecide && (
          <div className="flex space-x-3">
            <button
              onClick={() => {
                setDecisionNotice(null);
                setDecisionAction('reject');
              }}
              className="rounded-lg bg-red-100 px-4 py-2 font-medium text-red-700 transition hover:bg-red-200"
            >
              Từ chối
            </button>
            <button
              onClick={() => {
                setDecisionNotice(null);
                setDecisionAction('approve');
              }}
              disabled={!canApprove}
              title={
                canApprove
                  ? undefined
                  : 'Cần payment SUCCESS và bản chụp điều kiện trước khi chấp thuận'
              }
              className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {retryableReconciliation ? 'Thử lại an toàn' : 'Chấp thuận'}
            </button>
          </div>
        )}
      </div>

      {decisionNotice && (
        <div
          role={decisionNotice.tone === 'error' ? 'alert' : 'status'}
          className={`rounded-lg border p-4 text-sm ${
            decisionNotice.tone === 'error'
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-green-200 bg-green-50 text-green-800'
          }`}
        >
          {decisionNotice.message}
        </div>
      )}

      {detail.status === 'PROCESSING' && (
        <div role="status" className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          Provider đang xử lý yêu cầu. Chưa thu hồi quyền học hoặc kết luận hoàn tiền cho đến khi
          nhận được kết quả đã xác minh.
        </div>
      )}

      {detail.status === 'RECONCILIATION_REQUIRED' && (
        <div role="alert" className="rounded-lg border border-orange-300 bg-orange-50 p-4 text-sm text-orange-900">
          <p className="font-semibold">Cần đối soát thủ công với provider.</p>
          <p className="mt-1">
            Mã lý do: {detail.reconciliationReasonCode || 'Chưa có'}.{' '}
            {detail.providerStatus === 'SUCCESS'
              ? 'Provider đã báo thành công; không được gọi hoàn tiền lại. Cần hoàn tất đối soát kế toán.'
              : 'Có thể thử lại bằng nút trên sau khi kiểm tra provider; hệ thống giữ nguyên idempotency key để chống hoàn tiền hai lần.'}
          </p>
        </div>
      )}

      {canDecide && !canApprove && (
        <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Nút chấp thuận đang khóa vì payment chưa ở trạng thái SUCCESS hoặc chưa có bản chụp điều
          kiện. Finance Manager vẫn có thể từ chối yêu cầu với mã lý do phù hợp.
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-6">
          <h3 className="mb-4 text-lg font-bold text-gray-900">Thông tin yêu cầu</h3>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 md:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Mã đơn hàng</dt>
              <dd className="mt-1 text-sm font-semibold text-gray-900">{detail.orderCode}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Trạng thái</dt>
              <dd className="mt-1">
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusMeta.className}`}
                >
                  {statusMeta.label}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Học viên</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {detail.studentName} ({detail.studentEmail})
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Ngày yêu cầu</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(detail.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Khóa học</dt>
              <dd className="mt-1 text-sm text-gray-900">{detail.courseTitle || 'Chưa có'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Order item</dt>
              <dd className="mt-1 break-all text-sm text-gray-900">{detail.orderItemId || 'Chưa có'}</dd>
            </div>
            <div className="md:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Lý do yêu cầu</dt>
              <dd className="mt-1 rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm text-gray-900">
                {detail.reason}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="p-6">
          <h3 className="mb-4 text-lg font-bold text-gray-900">Số tiền và phân bổ</h3>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-sm text-gray-500">Tổng tiền item</dt>
              <dd className="mt-1 font-semibold text-gray-900">
                {formatMoney(detail.grossAmount, detail.currency)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Hoa hồng nền tảng</dt>
              <dd className="mt-1 font-semibold text-gray-900">
                {formatMoney(detail.commissionAmount, detail.currency)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Phần của giảng viên</dt>
              <dd className="mt-1 font-semibold text-gray-900">
                {formatMoney(detail.teacherNetAmount, detail.currency)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Số tiền provider ghi nhận</dt>
              <dd className="mt-1 font-semibold text-gray-900">
                {formatMoney(detail.paymentAmount, detail.currency)}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="p-6">
          <h3 className="mb-4 text-lg font-bold text-gray-900">Bằng chứng thanh toán và provider</h3>
          <dl className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-sm text-gray-500">Trạng thái thanh toán</dt>
              <dd className="mt-1 font-semibold text-gray-900">{detail.paymentStatus || 'Chưa có'}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Provider thanh toán</dt>
              <dd className="mt-1 text-gray-900">{detail.paymentProvider || 'Chưa có'}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Mã giao dịch thanh toán</dt>
              <dd className="mt-1 break-all text-gray-900">
                {detail.paymentProviderTransactionId || 'Chưa có'}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Trạng thái refund provider</dt>
              <dd className="mt-1 font-semibold text-gray-900">{detail.providerStatus || 'Chưa có'}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Provider thực thi</dt>
              <dd className="mt-1 text-gray-900">{detail.providerName || 'Chưa có'}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Provider reference</dt>
              <dd className="mt-1 break-all text-gray-900">{detail.providerReference || 'Chưa có'}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Mã kết quả provider</dt>
              <dd className="mt-1 text-gray-900">{detail.providerResultCode || 'Chưa có'}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Số lần gửi provider</dt>
              <dd className="mt-1 text-gray-900">{detail.providerAttemptCount ?? 0}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="p-6">
          <h3 className="mb-4 text-lg font-bold text-gray-900">Escrow</h3>
          <dl className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <dt className="text-sm text-gray-500">Trạng thái escrow</dt>
              <dd className="mt-1 font-semibold text-gray-900">{detail.escrowStatus || 'Chưa có'}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Số tiền escrow</dt>
              <dd className="mt-1 text-gray-900">{formatMoney(detail.escrowAmount, detail.currency)}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Ngày dự kiến giải ngân</dt>
              <dd className="mt-1 text-gray-900">{formatDate(detail.escrowReleaseAt)}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="p-6">
          <h3 className="mb-4 text-lg font-bold text-gray-900">Bản chụp điều kiện tại thời điểm yêu cầu</h3>
          <EvidenceSnapshot snapshot={detail.eligibilitySnapshot} />
        </div>
      </section>

      {(detail.decisionReasonCode || detail.decisionNote || detail.decidedAt) && (
        <section className="overflow-hidden rounded-xl border border-blue-200 bg-blue-50 shadow-sm">
          <div className="p-6">
            <h3 className="mb-4 text-lg font-bold text-gray-900">Quyết định kiểm toán</h3>
            <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <dt className="text-sm text-gray-500">Mã lý do quyết định</dt>
                <dd className="mt-1 font-semibold text-gray-900">
                  {detail.decisionReasonCode || 'Chưa có'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Thời điểm quyết định</dt>
                <dd className="mt-1 text-gray-900">{formatDate(detail.decidedAt)}</dd>
              </div>
              <div className="md:col-span-2">
                <dt className="text-sm text-gray-500">Ghi chú quyết định</dt>
                <dd className="mt-1 rounded-lg border border-blue-100 bg-white p-3 text-sm text-gray-900">
                  {detail.decisionNote || 'Chưa có'}
                </dd>
              </div>
            </dl>
          </div>
        </section>
      )}

      {decisionAction && (
        <RefundDecisionForm
          action={decisionAction}
          onConfirm={handleDecision}
          onCancel={() => {
            setDecisionAction(null);
            setDecisionNotice(null);
          }}
          errorMessage={decisionNotice?.tone === 'error' ? decisionNotice.message : null}
        />
      )}
    </div>
  );
}
