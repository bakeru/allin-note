"use client";

import Link from "next/link";
import { CalendarDays, ChevronRight, Mic, UserRound, X } from "lucide-react";
import { useEffect } from "react";

type TeacherRecordLauncherSheetProps = {
  open: boolean;
  todayReservationCount: number;
  onClose: () => void;
};

const options = [
  {
    href: "/record",
    title: "今日の予約から選ぶ",
    description: (count: number) =>
      count > 0 ? `今日の予約が ${count} 件あります` : "今日の予約はまだありません",
    icon: CalendarDays,
  },
  {
    href: "/reservations",
    title: "他の予約から選ぶ",
    description: () => "過去・未来の予約を確認して録音に進みます",
    icon: Mic,
  },
  {
    href: "/record/select-student",
    title: "予約なしで始める",
    description: () => "その場で生徒を選んで録音を開始します",
    icon: UserRound,
  },
] as const;

export function TeacherRecordLauncherSheet({
  open,
  todayReservationCount,
  onClose,
}: TeacherRecordLauncherSheetProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label="閉じる"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-[rgba(4,52,44,0.4)]"
      />

      <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-[28px] bg-white px-5 pt-4 pb-[calc(env(safe-area-inset-bottom)+18px)] shadow-[0_-16px_40px_rgba(4,52,44,0.18)]">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200" />

        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold tracking-[0.22em] text-[#1D9E75]">
              RECORD
            </p>
            <h2 className="text-xl font-semibold text-slate-900">
              どこから録音を始めますか
            </h2>
            <p className="text-sm leading-6 text-slate-500">
              いつもの流れに合わせて、録音の起点を選べます。
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          {options.map((option) => {
            const Icon = option.icon;

            return (
              <Link
                key={option.href}
                href={option.href}
                onClick={onClose}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 transition hover:border-[#9FE1CB] hover:bg-[#F4FBF8]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E1F5EE] text-[#1D9E75]">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-slate-900">
                    {option.title}
                  </span>
                  <span className="mt-0.5 block text-xs leading-5 text-slate-500">
                    {option.description(todayReservationCount)}
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </Link>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}
