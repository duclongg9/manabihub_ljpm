import { useState } from 'react';
import type { RefundDecisionReasonCode, RefundDecisionRequest } from '../types';

const MAX_DECISION_NOTE_LENGTH = 2000;

interface ReasonOption {
  code: RefundDecisionReasonCode;
  label: string;
}

const APPROVAL_REASONS: ReasonOption[] = [
  { code: 'STANDARD_ELIGIBLE', label: 'Đủ điều kiện theo chính sách hoàn tiền' },
  { code: 'DUPLICATE_CHARGE', label: 'Giao dịch bị tính phí trùng' },
  { code: 'CONFIRMED_PAYMENT_ERROR', label: 'Lỗi thanh toán đã được xác minh' },
  { code: 'PLATFORM_ACCESS_FAILURE', label: 'Không thể truy cập khóa học do lỗi nền tảng' },
];

const REJECTION_REASONS: ReasonOption[] = [
  { code: 'OUTSIDE_REFUND_WINDOW', label: 'Đã quá thời hạn hoàn tiền' },
  { code: 'PROGRESS_LIMIT_REACHED', label: 'Tiến độ học đã đạt hoặc vượt ngưỡng cho phép' },
  { code: 'PROTECTED_CONTENT_CONSUMED', label: 'Đã sử dụng nội dung được bảo vệ' },
  { code: 'PAYMENT_NOT_CONFIRMED', label: 'Thanh toán chưa được xác nhận' },
  { code: 'DUPLICATE_REQUEST', label: 'Yêu cầu hoàn tiền bị trùng' },
  { code: 'OTHER', label: 'Lý do khác' },
];

interface RefundDecisionFormProps {
  action: 'approve' | 'reject';
  onConfirm: (request: RefundDecisionRequest) => Promise<void>;
  onCancel: () => void;
  errorMessage?: string | null;
}

export function RefundDecisionForm({
  action,
  onConfirm,
  onCancel,
  errorMessage,
}: RefundDecisionFormProps) {
  const [reasonCode, setReasonCode] = useState<RefundDecisionReasonCode | ''>('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedNote = note.trim();
    if (!reasonCode || !normalizedNote) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm({ reasonCode, note: normalizedNote });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isApprove = action === 'approve';
  const reasonOptions = isApprove ? APPROVAL_REASONS : REJECTION_REASONS;
  const normalizedNoteLength = note.trim().length;
  const noteIsValid =
    normalizedNoteLength > 0 &&
    normalizedNoteLength <= MAX_DECISION_NOTE_LENGTH;
  const canSubmit = Boolean(reasonCode) && noteIsValid && !isSubmitting;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="refund-decision-title"
        className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100">
          <h3 id="refund-decision-title" className="text-xl font-bold text-gray-900">
            {isApprove ? 'Xác nhận chấp thuận' : 'Xác nhận từ chối'}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Chọn mã lý do kiểm toán và ghi rõ căn cứ cho quyết định này.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6" noValidate>
          {errorMessage && (
            <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="reasonCode" className="block text-sm font-medium text-gray-700 mb-1">
              Mã lý do <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <select
              id="reasonCode"
              value={reasonCode}
              onChange={(event) => setReasonCode(event.target.value as RefundDecisionReasonCode | '')}
              disabled={isSubmitting}
              required
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500"
            >
              <option value="">Chọn lý do</option>
              {reasonOptions.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
              Căn cứ quyết định <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <textarea
              id="note"
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={isSubmitting}
              maxLength={MAX_DECISION_NOTE_LENGTH}
              aria-describedby="refund-note-help"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              placeholder="Nêu bằng chứng đã đối chiếu và kết luận..."
              required
            />
            <p id="refund-note-help" className="mt-1 text-xs text-gray-500">
              Không được để trống, tối đa {MAX_DECISION_NOTE_LENGTH.toLocaleString('vi-VN')} ký tự.
              Hiện có {normalizedNoteLength.toLocaleString('vi-VN')} ký tự sau khi loại bỏ khoảng trắng.
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition disabled:opacity-50 flex items-center ${
                isApprove ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {isSubmitting && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isApprove ? 'Chấp thuận' : 'Từ chối'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
