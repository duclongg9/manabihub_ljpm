const BUSINESS_TIME_ZONE = 'Asia/Ho_Chi_Minh';

export function mondayOfCurrentWeek(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: BUSINESS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';
  const weekdayIndex = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    .indexOf(value('weekday'));
  const businessDate = new Date(Date.UTC(
    Number(value('year')),
    Number(value('month')) - 1,
    Number(value('day')),
  ));
  businessDate.setUTCDate(businessDate.getUTCDate() - Math.max(0, weekdayIndex));
  return businessDate.toISOString().slice(0, 10);
}
