const REPORTING_TIME_ZONE = 'Asia/Ho_Chi_Minh';

export function reportingDateInputValue(date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: REPORTING_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function reportingMonthRange(now: Date) {
  const to = reportingDateInputValue(now);
  return {
    from: `${to.slice(0, 8)}01`,
    to,
  };
}
