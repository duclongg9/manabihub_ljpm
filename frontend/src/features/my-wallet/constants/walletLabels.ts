/**
 * UC-17 display mapping.
 *
 * The frontend never parses the raw backend `message`. It maps `messageCode`
 * and enum values to Vietnamese copy here, so changing the API wording never
 * breaks the UI.
 */
import type {
  PayoutSettlementStatus,
  WalletTopUpStatus,
  WalletTransactionType,
  WithdrawalRequestStatus,
} from '../types/walletTypes';

export const TRANSACTION_TYPE_LABELS: Record<WalletTransactionType, string> = {
  TOP_UP: 'Nạp ví',
  PURCHASE: 'Thanh toán khóa học',
  REFUND: 'Hoàn tiền',
  REVENUE_SHARE: 'Doanh thu chia sẻ',
  PAYOUT: 'Chi trả rút tiền',
  ADJUSTMENT: 'Điều chỉnh',
  ESCROW_HOLD: 'Giữ doanh thu',
  ESCROW_RELEASE: 'Giải ngân doanh thu',
};

export const TOP_UP_STATUS_LABELS: Record<WalletTopUpStatus, string> = {
  PENDING: 'Chờ thanh toán',
  SUCCEEDED: 'Thành công',
  FAILED: 'Thất bại',
  CANCELLED: 'Đã hủy',
};

export const WITHDRAWAL_STATUS_LABELS: Record<WithdrawalRequestStatus, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Bị từ chối',
  EXECUTED: 'Đã chi trả',
  FAILED: 'Chi trả thất bại',
};

export const PAYOUT_STATUS_LABELS: Record<PayoutSettlementStatus, string> = {
  PENDING: 'Đang xử lý',
  SUCCESS: 'Thành công',
  FAILED: 'Thất bại',
  RECONCILIATION_MISMATCH: 'Lệch đối soát',
};

/** MSG codes from the SRS message catalogue. */
export const WALLET_MESSAGE_LABELS: Record<string, string> = {
  'MSG-WALLET-001': 'Số dư khả dụng không đủ để thực hiện yêu cầu.',
  'MSG-WALLET-002': 'Yêu cầu rút tiền đã được tạo.',
  'MSG-WALLET-003': 'Ví doanh thu đang bị tạm khóa do vi phạm hoặc đang chờ xử lý.',
  WALLET_TOP_UP_CREATED: 'Đã tạo yêu cầu nạp ví. Vui lòng hoàn tất thanh toán.',
  WALLET_TOP_UP_BELOW_MINIMUM: 'Số tiền nạp thấp hơn mức tối thiểu cho phép.',
  WALLET_TOP_UP_ALREADY_PENDING: 'Bạn đang có một yêu cầu nạp ví chưa hoàn tất.',
  WALLET_TOP_UP_AMOUNT_INVALID: 'Số tiền nạp không hợp lệ.',
  WALLET_ACTION_NOT_ALLOWED_FOR_ROLE: 'Vai trò hiện tại không được phép thực hiện thao tác này.',
  WALLET_STUDENT_PROFILE_NOT_FOUND: 'Không tìm thấy hồ sơ học viên.',
  WALLET_TEACHER_PROFILE_NOT_FOUND: 'Không tìm thấy hồ sơ giáo viên.',
  VALIDATION_FAILED: 'Dữ liệu nhập chưa hợp lệ.',
};

const FALLBACK_ERROR = 'Không thể tải dữ liệu ví. Vui lòng thử lại.';

/**
 * Maps a backend messageCode to Vietnamese copy, with a neutral fallback so an
 * unmapped code never surfaces raw English text to the user.
 */
export function walletMessage(messageCode?: string | null): string {
  if (!messageCode) {
    return FALLBACK_ERROR;
  }
  return WALLET_MESSAGE_LABELS[messageCode] ?? FALLBACK_ERROR;
}
