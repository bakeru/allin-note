"use client";

import { Check, ChevronRight, CircleX } from "lucide-react";

import { cn } from "@/lib/utils";

type MobileDateListDay = {
  dateKey: string;
  day: number;
  weekday: number;
  availableCount: number;
  isSelectable: boolean;
  isSelected: boolean;
};

type MobileDateListProps = {
  days: MobileDateListDay[];
  hasMore: boolean;
  onLoadNextWeek: () => void;
  onSelectDate: (dateKey: string) => void;
};

const WEEKDAY_JA = ["日", "月", "火", "水", "木", "金", "土"];

const getWeekdayColor = (weekday: number) => {
  if (weekday === 0) return "text-pink-500";
  if (weekday === 6) return "text-sky-500";
  return "text-slate-500";
};

export function MobileDateList({
  days,
  hasMore,
  onLoadNextWeek,
  onSelectDate,
}: MobileDateListProps) {
  return (
    <div className="flex flex-col gap-2 md:hidden">
      {days.map((day) => {
        const weekdayColor = getWeekdayColor(day.weekday);

        if (day.isSelected) {
          return (
            <button
              key={day.dateKey}
              type="button"
              onClick={() => onSelectDate(day.dateKey)}
              className="grid grid-cols-[36px_36px_1fr_auto] items-center gap-3 rounded-2xl border border-[#1D9E75] bg-[#1D9E75] px-3 py-3 text-left"
            >
              <span className="text-[11px] text-white/80">
                {WEEKDAY_JA[day.weekday]}
              </span>
              <span className="text-[17px] font-medium text-white">
                {day.day}
              </span>
              <span className="text-[12px] text-white/95">
                空き {day.availableCount}枠
              </span>
              <Check className="h-4 w-4 text-white" />
            </button>
          );
        }

        if (!day.isSelectable) {
          return (
            <button
              key={day.dateKey}
              type="button"
              disabled
              className="grid cursor-not-allowed grid-cols-[36px_36px_1fr_auto] items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-left"
            >
              <span className={cn("text-[11px] opacity-50", weekdayColor)}>
                {WEEKDAY_JA[day.weekday]}
              </span>
              <span className="text-[17px] font-medium text-slate-400">
                {day.day}
              </span>
              <span className="text-[12px] text-slate-400">空きなし</span>
              <CircleX className="h-4 w-4 text-slate-400" />
            </button>
          );
        }

        return (
          <button
            key={day.dateKey}
            type="button"
            onClick={() => onSelectDate(day.dateKey)}
            className="grid grid-cols-[36px_36px_1fr_auto] items-center gap-3 rounded-2xl border border-[#9FE1CB] bg-[#E1F5EE] px-3 py-3 text-left transition hover:bg-[#d6f1e7]"
          >
            <span className={cn("text-[11px]", weekdayColor)}>
              {WEEKDAY_JA[day.weekday]}
            </span>
            <span className="text-[17px] font-medium text-[#04342C]">
              {day.day}
            </span>
            <span className="text-[12px] text-[#0F6E56]">
              空き {day.availableCount}枠
            </span>
            <ChevronRight className="h-4 w-4 text-[#0F6E56]" />
          </button>
        );
      })}

      {hasMore ? (
        <button
          type="button"
          onClick={onLoadNextWeek}
          className="rounded-2xl border border-dashed border-slate-300 py-3 text-center text-[12px] font-medium text-slate-500 transition hover:border-[#9FE1CB] hover:text-[#0F6E56]"
        >
          もっと見る
        </button>
      ) : null}
    </div>
  );
}
