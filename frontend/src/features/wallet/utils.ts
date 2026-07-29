import type {
  PayoutStatus,
  WalletActivity,
  WalletActivityFilter,
  WalletTransactionSection,
} from './types';

export function formatMoney(amount: number, currency: string): string {
  return `${amount.toLocaleString('vi-VN')} ${currency}`;
}

export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('vi-VN');
}

export const SECTION_LABELS: Record<WalletTransactionSection, string> = {
  TOP_UP: 'Nạp tiền',
  PAYMENT: 'Thanh toán',
  REFUND: 'Hoàn tiền',
  ESCROW_HOLD: 'Tạm giữ (escrow)',
  ESCROW_RELEASE: 'Giải ngân escrow',
  WITHDRAWAL: 'Rút tiền',
  REVENUE_SHARE: 'Chia sẻ doanh thu',
  ADJUSTMENT: 'Điều chỉnh',
  OTHER: 'Khác',
};

export const PAYOUT_STATUS_LABELS: Record<PayoutStatus, string> = {
  NO_ACTIVITY: 'Chưa có hoạt động',
  ESCROW_PENDING: 'Đang giữ trong escrow',
  AVAILABLE_FOR_PAYOUT: 'Sẵn sàng rút tiền',
};

export const PAYOUT_STATUS_COLORS: Record<PayoutStatus, 'default' | 'warning' | 'success'> = {
  NO_ACTIVITY: 'default',
  ESCROW_PENDING: 'warning',
  AVAILABLE_FOR_PAYOUT: 'success',
};

/**
 * Applies the UC-17 step-6 history filter. Date bounds are inclusive and interpreted in the
 * viewer's local timezone, matching the dates rendered in the table.
 */
export function filterActivity(
  items: WalletActivity[],
  filter: WalletActivityFilter,
): WalletActivity[] {
  const from = filter.from ? new Date(`${filter.from}T00:00:00`).getTime() : null;
  const to = filter.to ? new Date(`${filter.to}T23:59:59.999`).getTime() : null;
  const query = filter.query.trim().toLowerCase();

  return items.filter((item) => {
    if (filter.section !== 'ALL' && item.section !== filter.section) return false;

    const occurredAt = new Date(item.occurredAt).getTime();
    if (from !== null && occurredAt < from) return false;
    if (to !== null && occurredAt > to) return false;

    if (query) {
      const haystack = `${item.referenceCode ?? ''} ${item.note ?? ''}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }

    return true;
  });
}
