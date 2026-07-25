/**
 * Formatting helpers for the wallet screen.
 *
 * Amounts arrive as JSON numbers from a NUMERIC(12,2) column, so they are safe
 * to format directly; no arithmetic is performed on the client.
 */

const currencyFormatters = new Map<string, Intl.NumberFormat>();

function formatterFor(currency: string): Intl.NumberFormat {
  const cached = currencyFormatters.get(currency);
  if (cached) {
    return cached;
  }

  const formatter = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  });
  currencyFormatters.set(currency, formatter);
  return formatter;
}

export function formatMoney(amount: number | null | undefined, currency = 'VND'): string {
  if (amount === null || amount === undefined) {
    return '—';
  }

  try {
    return formatterFor(currency).format(amount);
  } catch {
    // Unknown currency code: fall back to a plain grouped number.
    return `${new Intl.NumberFormat('vi-VN').format(amount)} ${currency}`;
  }
}

/** Signed amount for a ledger row, e.g. "+250.000 ₫" / "-250.000 ₫". */
export function formatSignedMoney(
  amount: number,
  direction: 'IN' | 'OUT',
  currency = 'VND',
): string {
  const sign = direction === 'IN' ? '+' : '-';
  return `${sign}${formatMoney(amount, currency)}`;
}

const dateTimeFormatter = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatDateTime(isoString: string | null | undefined): string {
  if (!isoString) {
    return '—';
  }

  const parsed = new Date(isoString);
  if (Number.isNaN(parsed.getTime())) {
    return '—';
  }

  return dateTimeFormatter.format(parsed);
}
