import Link from "next/link";
import {
  Bell,
  CalendarDays,
  ChevronRight,
  Clock3,
  Coffee,
  FileText,
  MapPin,
  Mic,
  Send,
  Sprout,
} from "lucide-react";

import { formatJstDateTimeLabel, formatJstTimeLabel } from "@/lib/reservations/jst";

export type TeacherHomeLesson = {
  id: string;
  scheduledAt: string;
  durationMinutes: number;
  studentName: string;
  locationName: string;
  status: string;
};

export type TeacherHomeTodo = {
  href: string;
  title: string;
  description: string;
  kind: "unsent" | "schedule" | "record";
};

type TeacherMobileHomeProps = {
  displayName: string;
  greeting: string;
  currentTimeIso: string;
  todayLessonCount: number;
  unsentCount: number;
  highlightedLesson: TeacherHomeLesson | null;
  nextLesson: TeacherHomeLesson | null;
  todoItems: TeacherHomeTodo[];
};

const getShortName = (displayName: string) =>
  displayName.trim().split(/[\s　]+/)[0] ?? displayName;

const formatLessonRange = (lesson: TeacherHomeLesson) => {
  const start = new Date(lesson.scheduledAt);
  const end = new Date(start.getTime() + lesson.durationMinutes * 60 * 1000);

  return `${formatJstTimeLabel(start)} - ${formatJstTimeLabel(end)}`;
};

const getLessonBadge = (
  lesson: TeacherHomeLesson,
  currentTimeIso: string
) => {
  const now = new Date(currentTimeIso);
  const start = new Date(lesson.scheduledAt);
  const end = new Date(start.getTime() + lesson.durationMinutes * 60 * 1000);

  if (now >= start && now < end) {
    return "進行中";
  }

  const diffMinutes = Math.round((start.getTime() - now.getTime()) / 60000);

  if (diffMinutes >= 0 && diffMinutes <= 30) {
    return `あと${diffMinutes}分`;
  }

  return null;
};

const formatNextLessonSummary = (lesson: TeacherHomeLesson | null) => {
  if (!lesson) {
    return "次回の予定が入るとここに表示されます。";
  }

  return `次のレッスンは${formatJstDateTimeLabel(
    new Date(lesson.scheduledAt)
  )} / ${lesson.studentName}さん（${lesson.durationMinutes}分）`;
};

export function TeacherMobileHome({
  displayName,
  greeting,
  currentTimeIso,
  todayLessonCount,
  unsentCount,
  highlightedLesson,
  nextLesson,
  todoItems,
}: TeacherMobileHomeProps) {
  const shortName = getShortName(displayName);
  const highlightedBadge = highlightedLesson
    ? getLessonBadge(highlightedLesson, currentTimeIso)
    : null;

  return (
    <div className="min-h-screen bg-[#f7faf8] px-5 pt-6 pb-10 md:hidden">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#bcefd4] via-[#9fe6c4] to-[#7fddb0] text-[#23463a] shadow-[0_10px_25px_rgba(127,221,176,0.35)]">
            <Sprout className="h-5 w-5" />
          </span>
          <div className="leading-tight">
            <p className="text-[1.35rem] font-extrabold tracking-tight text-slate-800">
              AllIn Note
            </p>
            <p className="text-[10px] font-semibold tracking-[0.2em] text-slate-400">
              オールインノート
            </p>
          </div>
        </div>
        <button
          type="button"
          className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500"
        >
          <Bell className="h-4 w-4" />
          {unsentCount > 0 ? (
            <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[#ef4444]" />
          ) : null}
        </button>
      </div>

      <div className="mb-5">
        <p className="text-sm font-medium text-slate-500">{greeting}</p>
        <h1 className="mt-1 text-[1.9rem] font-semibold tracking-tight text-slate-900">
          {shortName}さん
        </h1>
      </div>

      {todayLessonCount > 0 ? (
        <div className="mb-6 grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-[0_8px_20px_rgba(15,23,42,0.03)]">
            <div className="text-[10px] text-slate-600">今日のレッスン</div>
            <div className="mt-1 text-2xl font-medium text-slate-900">
              {todayLessonCount}
              <span className="ml-0.5 text-[11px] font-normal text-slate-400">
                件
              </span>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-[0_8px_20px_rgba(15,23,42,0.03)]">
            <div className="text-[10px] text-slate-600">送信待ち</div>
            <div className="mt-1 text-2xl font-medium text-slate-900">
              {unsentCount}
              <span className="ml-0.5 text-[11px] font-normal text-slate-400">
                件
              </span>
            </div>
          </div>
        </div>
      ) : null}

      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">次のレッスン</h2>
          <Link
            href="/reservations"
            className="text-[11px] font-semibold text-[#1D9E75]"
          >
            すべて見る
          </Link>
        </div>

        {todayLessonCount === 0 ? (
          <div className="rounded-[24px] border border-[#d9eee6] bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#E1F5EE] text-[#1D9E75]">
              <Coffee className="h-5 w-5" />
            </span>
            <h3 className="text-lg font-semibold text-slate-900">
              今日はレッスンなし
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {formatNextLessonSummary(nextLesson)}
            </p>
          </div>
        ) : highlightedLesson ? (
          <div className="rounded-[24px] border border-[#1D9E75] bg-[#E1F5EE] p-4 shadow-[0_12px_30px_rgba(29,158,117,0.12)]">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="text-[13px] font-medium text-[#0F6E56]">
                {formatLessonRange(highlightedLesson)}
              </span>
              {highlightedBadge ? (
                <span className="rounded-full bg-[#1D9E75] px-2 py-0.5 text-[10px] font-medium text-white">
                  {highlightedBadge}
                </span>
              ) : null}
            </div>
            <div className="mb-1.5 text-base font-medium text-[#04342C]">
              {highlightedLesson.studentName}さん
            </div>
            <div className="flex flex-wrap gap-2.5 text-[11px] text-slate-600">
              <span className="inline-flex items-center gap-1">
                <Clock3 className="h-3 w-3" />
                {highlightedLesson.durationMinutes}分
              </span>
              {highlightedLesson.locationName ? (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {highlightedLesson.locationName}
                </span>
              ) : null}
            </div>
            <Link
              href={`/record/start/${highlightedLesson.id}`}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#1D9E75] py-2.5 text-[13px] font-medium text-white"
            >
              <Mic className="h-4 w-4" />
              このレッスンの録音を始める
            </Link>
          </div>
        ) : null}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">あとでやること</h2>
        </div>

        <div className="space-y-3">
          {todoItems.map((item) => {
            const iconClassName =
              item.kind === "unsent"
                ? "bg-[#fff1e7] text-[#dd6b20]"
                : item.kind === "schedule"
                  ? "bg-[#E1F5EE] text-[#1D9E75]"
                  : "bg-[#eef6ff] text-[#2563eb]";
            const Icon =
              item.kind === "unsent"
                ? Send
                : item.kind === "schedule"
                  ? CalendarDays
                  : FileText;

            return (
              <Link
                key={`${item.kind}-${item.href}`}
                href={item.href}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-[0_8px_20px_rgba(15,23,42,0.03)] transition hover:border-[#9FE1CB] hover:bg-[#fbfefd]"
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${iconClassName}`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-slate-900">
                    {item.title}
                  </span>
                  <span className="mt-0.5 block text-xs leading-5 text-slate-500">
                    {item.description}
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
