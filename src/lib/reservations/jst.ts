const JST_TIME_ZONE = "Asia/Tokyo";
const JST_OFFSET_HOURS = 9;

export const BOOKING_START_HOUR = 9;
export const BOOKING_END_HOUR = 23;

const jstDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: JST_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const jstCalendarDateFormatter = new Intl.DateTimeFormat("ja-JP", {
  timeZone: JST_TIME_ZONE,
  month: "numeric",
  day: "numeric",
  weekday: "short",
});

const jstDateTimeFormatter = new Intl.DateTimeFormat("ja-JP", {
  timeZone: JST_TIME_ZONE,
  month: "numeric",
  day: "numeric",
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function getPart(
  parts: Intl.DateTimeFormatPart[],
  type: "year" | "month" | "day" | "hour" | "minute"
) {
  return parts.find((part) => part.type === type)?.value ?? "";
}

export function formatJstDateKey(date: Date) {
  const parts = jstDateFormatter.formatToParts(date);
  return `${getPart(parts, "year")}-${getPart(parts, "month")}-${getPart(
    parts,
    "day"
  )}`;
}

export function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);

  return { year, month, day };
}

export function addDaysToDateKey(dateKey: string, days: number) {
  const { year, month, day } = parseDateKey(dateKey);
  const cursor = new Date(Date.UTC(year, month - 1, day));
  cursor.setUTCDate(cursor.getUTCDate() + days);

  const nextYear = cursor.getUTCFullYear();
  const nextMonth = `${cursor.getUTCMonth() + 1}`.padStart(2, "0");
  const nextDay = `${cursor.getUTCDate()}`.padStart(2, "0");

  return `${nextYear}-${nextMonth}-${nextDay}`;
}

export function createDateFromDateKey(
  dateKey: string,
  hour = 0,
  minute = 0
) {
  const { year, month, day } = parseDateKey(dateKey);
  return new Date(
    Date.UTC(year, month - 1, day, hour - JST_OFFSET_HOURS, minute)
  );
}

export function formatJstDateLabel(dateKey: string) {
  return jstCalendarDateFormatter.format(createDateFromDateKey(dateKey, 12, 0));
}

export function formatJstTimeLabel(date: Date) {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: JST_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatJstDateTimeLabel(date: Date) {
  return jstDateTimeFormatter.format(date);
}

export function getMonthKey(dateKey: string) {
  return dateKey.slice(0, 7);
}

export function getWeekday(dateKey: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: JST_TIME_ZONE,
    weekday: "short",
  }).format(createDateFromDateKey(dateKey, 12, 0));
}
