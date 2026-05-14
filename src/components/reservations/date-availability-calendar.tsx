"use client";

import { ChevronDown, ChevronLeft, ChevronRight, CircleX } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { MobileDateList } from "@/components/reservations/mobile-date-list";
import { cn } from "@/lib/utils";

type DateAvailabilityCalendarProps = {
  availabilityByDate: Record<string, number>;
  minDateKey: string;
  maxDateKey: string;
  selectedDateKey: string | null;
  onSelectDate: (dateKey: string) => void;
};

const WEEK_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

const compareDateKeys = (left: string, right: string) => left.localeCompare(right);

const createUtcDate = (year: number, month: number, day: number) =>
  new Date(Date.UTC(year, month - 1, day));

const formatUtcDateKey = (date: Date) => {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${date.getUTCDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getMonthKey = (dateKey: string) => dateKey.slice(0, 7);

const shiftMonthKey = (monthKey: string, offset: number) => {
  const [year, month] = monthKey.split("-").map(Number);
  const cursor = new Date(Date.UTC(year, month - 1 + offset, 1));
  return `${cursor.getUTCFullYear()}-${`${cursor.getUTCMonth() + 1}`.padStart(2, "0")}`;
};

const getMonthLabel = (monthKey: string) => {
  const [year, month] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
  }).format(createUtcDate(year, month, 1));
};

const getMonthShortLabel = (monthKey: string) => {
  const [, month] = monthKey.split("-").map(Number);
  return `${month}月`;
};

type CalendarDay = {
  dateKey: string;
  day: number;
  weekday: number;
  isCurrentMonth: boolean;
  isSelectable: boolean;
  isUnavailable: boolean;
  availableCount: number;
};

export function DateAvailabilityCalendar({
  availabilityByDate,
  minDateKey,
  maxDateKey,
  selectedDateKey,
  onSelectDate,
}: DateAvailabilityCalendarProps) {
  const minMonthKey = getMonthKey(minDateKey);
  const maxMonthKey = getMonthKey(maxDateKey);
  const [visibleMonthKey, setVisibleMonthKey] = useState(
    selectedDateKey ? getMonthKey(selectedDateKey) : minMonthKey
  );
  const [mobileVisibleDaysCount, setMobileVisibleDaysCount] = useState(7);

  useEffect(() => {
    if (selectedDateKey) {
      setVisibleMonthKey(getMonthKey(selectedDateKey));
    }
  }, [selectedDateKey]);

  useEffect(() => {
    setMobileVisibleDaysCount(7);
  }, [visibleMonthKey]);

  const days = useMemo<CalendarDay[]>(() => {
    const [year, month] = visibleMonthKey.split("-").map(Number);
    const firstOfMonth = createUtcDate(year, month, 1);
    const firstWeekday = firstOfMonth.getUTCDay();
    const gridStart = new Date(firstOfMonth);
    gridStart.setUTCDate(firstOfMonth.getUTCDate() - firstWeekday);

    return Array.from({ length: 42 }, (_, index) => {
      const dayDate = new Date(gridStart);
      dayDate.setUTCDate(gridStart.getUTCDate() + index);
      const dateKey = formatUtcDateKey(dayDate);
      const availableCount = availabilityByDate[dateKey] ?? 0;
      const withinWindow =
        compareDateKeys(dateKey, minDateKey) >= 0 &&
        compareDateKeys(dateKey, maxDateKey) <= 0;

      return {
        dateKey,
        day: dayDate.getUTCDate(),
        weekday: dayDate.getUTCDay(),
        isCurrentMonth: getMonthKey(dateKey) === visibleMonthKey,
        isSelectable: withinWindow && availableCount > 0,
        isUnavailable: withinWindow && availableCount === 0,
        availableCount,
      };
    });
  }, [availabilityByDate, maxDateKey, minDateKey, visibleMonthKey]);

  const canGoPrevMonth = compareDateKeys(visibleMonthKey, minMonthKey) > 0;
  const canGoNextMonth = compareDateKeys(visibleMonthKey, maxMonthKey) < 0;
  const rangeDays = useMemo<CalendarDay[]>(() => {
    const startParts = parseDateParts(minDateKey);
    const endParts = parseDateParts(maxDateKey);
    const startDate = createUtcDate(
      startParts.year,
      startParts.month,
      startParts.day
    );
    const endDate = createUtcDate(endParts.year, endParts.month, endParts.day);
    const daysInRange: CalendarDay[] = [];
    const cursor = new Date(startDate);

    while (cursor <= endDate) {
      const dateKey = formatUtcDateKey(cursor);
      const availableCount = availabilityByDate[dateKey] ?? 0;

      daysInRange.push({
        dateKey,
        day: cursor.getUTCDate(),
        weekday: cursor.getUTCDay(),
        isCurrentMonth: getMonthKey(dateKey) === visibleMonthKey,
        isSelectable: availableCount > 0,
        isUnavailable: availableCount === 0,
        availableCount,
      });

      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    return daysInRange;
  }, [availabilityByDate, maxDateKey, minDateKey, visibleMonthKey]);

  const monthOptions = useMemo(
    () =>
      Array.from(new Set(rangeDays.map((day) => getMonthKey(day.dateKey)))).map(
        (monthKey) => ({
          value: monthKey,
          label: getMonthShortLabel(monthKey),
        })
      ),
    [rangeDays]
  );

  const mobileStartIndex = Math.max(
    rangeDays.findIndex((day) => getMonthKey(day.dateKey) === visibleMonthKey),
    0
  );

  const mobileVisibleDays = rangeDays
    .slice(mobileStartIndex, mobileStartIndex + mobileVisibleDaysCount)
    .map((day) => ({
      ...day,
      isSelected: day.dateKey === selectedDateKey,
    }));

  const hasMoreMobileDays =
    mobileStartIndex + mobileVisibleDaysCount < rangeDays.length;

  return (
    <div className="rounded-3xl border border-[#d7ece0] bg-white p-4 shadow-sm sm:p-5">
      <div className="md:hidden">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-[0.18em] text-[#7fbf9e] uppercase">
              Step 1
            </p>
            <h3 className="mt-1 text-xl font-semibold text-slate-950">
              日付を選ぶ
            </h3>
          </div>
          <label className="relative shrink-0">
            <select
              value={visibleMonthKey}
              onChange={(event) => setVisibleMonthKey(event.target.value)}
              className="appearance-none rounded-full border border-[#d7ece0] bg-white px-4 py-2 pr-9 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#92e2bb]"
            >
              {monthOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          </label>
        </div>
        <p className="mb-4 text-sm text-slate-600">
          タップで予約可能な日を選択
        </p>
        <MobileDateList
          days={mobileVisibleDays}
          hasMore={hasMoreMobileDays}
          onLoadNextWeek={() =>
            setMobileVisibleDaysCount((current) =>
              Math.min(current + 7, rangeDays.length - mobileStartIndex)
            )
          }
          onSelectDate={onSelectDate}
        />
      </div>

      <div className="hidden md:block">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-[#7fbf9e] uppercase">
              Step 1
            </p>
            <h3 className="mt-1 text-lg font-semibold text-slate-950">
              日付を選ぶ
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setVisibleMonthKey((current) => shiftMonthKey(current, -1))
              }
              disabled={!canGoPrevMonth}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-[#92e2bb] hover:text-[#249768] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="min-w-[8rem] text-center text-sm font-semibold text-slate-900">
              {getMonthLabel(visibleMonthKey)}
            </div>
            <button
              type="button"
              onClick={() =>
                setVisibleMonthKey((current) => shiftMonthKey(current, 1))
              }
              disabled={!canGoNextMonth}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-[#92e2bb] hover:text-[#249768] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {WEEK_LABELS.map((label, index) => (
            <div
              key={label}
              className={cn(
                "px-1 pb-2 text-center text-xs font-semibold",
                index === 0
                  ? "text-pink-500"
                  : index === 6
                    ? "text-sky-500"
                    : "text-slate-500"
              )}
            >
              {label}
            </div>
          ))}
          {days.map((day) => {
            const isSelected = day.dateKey === selectedDateKey;
            const weekendClass =
              day.weekday === 0
                ? "text-pink-500"
                : day.weekday === 6
                  ? "text-sky-500"
                  : "text-slate-900";

            return (
              <button
                key={day.dateKey}
                type="button"
                disabled={!day.isSelectable}
                onClick={() => onSelectDate(day.dateKey)}
                className={cn(
                  "flex min-h-[5.6rem] flex-col items-center justify-between rounded-2xl border px-2 py-3 text-center transition",
                  day.isCurrentMonth ? "opacity-100" : "opacity-45",
                  isSelected
                    ? "border-[#57c793] bg-[#8fe2b8] text-slate-950 shadow-sm"
                    : day.isSelectable
                      ? "border-[#dcebe3] bg-[#f8fcfa] hover:border-[#92e2bb] hover:bg-[#eef8f2]"
                      : day.isUnavailable
                        ? "border-slate-200 bg-slate-50 text-slate-400"
                        : "border-transparent bg-transparent text-slate-300"
                )}
              >
                <span className={cn("text-sm font-semibold", weekendClass)}>
                  {day.day}
                </span>
                {day.isSelectable ? (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-medium",
                      isSelected
                        ? "bg-white/75 text-[#0f5132]"
                        : "bg-[#dff6ea] text-[#227a52]"
                    )}
                  >
                    空{day.availableCount}
                  </span>
                ) : day.isUnavailable ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                    <CircleX className="h-3.5 w-3.5" />
                    ×
                  </span>
                ) : (
                  <span className="text-[11px] text-transparent">-</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function parseDateParts(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return { year, month, day };
}
