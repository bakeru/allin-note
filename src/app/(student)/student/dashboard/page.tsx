import Link from "next/link";
import {
  BookOpenText,
  CalendarDays,
  CircleUserRound,
  School2,
} from "lucide-react";

import { CancelReservationButton } from "@/components/reservations/cancel-reservation-button";
import { ReservationStatusBadge } from "@/components/reservations/reservation-status-badge";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { createServiceClient } from "@/lib/supabase/service";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const formatRecordedAt = (value: string) =>
  new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const formatDuration = (durationSeconds: number | null) => {
  if (!durationSeconds) return "時間未記録";

  const minutes = Math.max(1, Math.round(durationSeconds / 60));
  return `${minutes}分`;
};

const formatReservationAt = (value: string) =>
  new Intl.DateTimeFormat("ja-JP", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const formatUpcomingDate = (value: string) =>
  new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
  }).format(new Date(value));

const getGreetingDate = () =>
  new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date()).toUpperCase();

export default async function StudentDashboardPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "student") {
    return null;
  }

  const supabase = createServiceClient();
  const [{ data: lessons }, { data: upcomingReservations }, { data: student }] =
    await Promise.all([
      supabase
        .from("lessons")
        .select("id, recorded_at, duration_seconds")
        .eq("student_id", user.id)
        .eq("status", "ready")
        .not("sent_at", "is", null)
        .eq("hidden_by_student", false)
        .order("recorded_at", { ascending: false }),
      supabase
        .from("reservations")
        .select(
          `
            id,
            scheduled_at,
            duration_minutes,
            status,
            location:locations(name)
          `
        )
        .eq("student_id", user.id)
        .eq("status", "scheduled")
        .gte("scheduled_at", new Date().toISOString())
        .order("scheduled_at", { ascending: true }),
      supabase
        .from("students")
        .select(
          `
            school_id,
            school:schools!students_school_id_fkey(
              cancellation_deadline_hours,
              late_cancellation_policy
            )
          `
        )
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .single(),
    ]);

  const school = Array.isArray(student?.school)
    ? student.school[0]
    : student?.school;
  const nextReservation = upcomingReservations?.[0] ?? null;

  return (
    <div className="mx-auto min-h-[calc(100vh-3.5rem)] w-full max-w-md px-4 pb-28 pt-5 sm:max-w-5xl sm:px-5 sm:pt-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold tracking-[0.28em] text-slate-400">
            {getGreetingDate()}
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-slate-950">
            <span className="mr-2 text-2xl font-medium text-slate-500">
              こんにちは、
            </span>
            {user.display_name}さん
          </h1>
        </div>
        <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-300 via-emerald-400 to-emerald-500 text-xl font-bold text-white shadow-[0_14px_36px_rgba(52,211,153,0.35)]">
          {user.display_name.slice(0, 1)}
          <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-[#f7fbf8] bg-emerald-300" />
        </div>
      </div>

      {nextReservation ? (
        <section className="relative mb-8 overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#102232_0%,#1f364b_100%)] px-6 py-6 text-white shadow-[0_24px_60px_rgba(15,31,46,0.24)]">
          <div className="absolute right-[-36px] top-[-36px] h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(125,224,176,0.22)_0%,transparent_68%)]" />
          <div className="relative flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-[11px] font-bold tracking-[0.28em] text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(125,224,176,0.9)]" />
              UPCOMING LESSON
            </p>
            <p className="text-sm font-semibold text-white/65">
              あと{" "}
              <strong className="text-lg text-emerald-300">
                {Math.max(
                  0,
                  Math.ceil(
                    (new Date(nextReservation.scheduled_at).getTime() -
                      Date.now()) /
                      (1000 * 60 * 60 * 24)
                  )
                )}
              </strong>
              日
            </p>
          </div>
          <div className="relative mt-5">
            <h2 className="text-5xl font-extrabold tracking-tight">
              {formatUpcomingDate(nextReservation.scheduled_at).split("(")[0]}
              <span className="ml-2 text-2xl font-medium text-white/65">
                {formatUpcomingDate(nextReservation.scheduled_at).match(/\(.+\)/)?.[0] ??
                  ""}
              </span>
            </h2>
            <p className="mt-3 text-2xl font-medium text-white/88">
              {new Intl.DateTimeFormat("ja-JP", {
                hour: "2-digit",
                minute: "2-digit",
              }).format(new Date(nextReservation.scheduled_at))}{" "}
              - {nextReservation.duration_minutes ?? 60}分レッスン
            </p>
          </div>
          <div className="relative mt-6 grid grid-cols-2 gap-3 border-t border-white/12 pt-5">
            <div className="rounded-2xl border border-white/8 bg-white/7 p-4 backdrop-blur-sm">
              <p className="mb-1 text-[10px] font-bold tracking-[0.18em] text-emerald-300">
                POLICY
              </p>
              <p className="text-sm font-semibold text-white">
                {school?.late_cancellation_policy === "no_cancel"
                  ? "直前キャンセル制限あり"
                  : "通常キャンセル可"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/7 p-4 backdrop-blur-sm">
              <p className="mb-1 text-[10px] font-bold tracking-[0.18em] text-emerald-300">
                STATUS
              </p>
              <p className="text-sm font-semibold text-white">予約済み</p>
            </div>
          </div>
        </section>
      ) : (
        <section className="mb-8 rounded-[28px] border border-emerald-100 bg-white px-6 py-6 shadow-[0_16px_40px_rgba(15,31,46,0.08)]">
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">
            次回のレッスンを予約
          </h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            空いている時間から選んで、そのまま予約できます。
          </p>
          <Link
            href="/student/reservations/new"
            className={buttonVariants({
              size: "lg",
              className:
                "mt-5 w-full rounded-2xl bg-slate-950 text-white hover:bg-slate-800",
            })}
          >
            最初の予約を入れる
          </Link>
        </section>
      )}

      <section className="mb-8 space-y-4">
        <div className="flex items-center justify-between gap-4 px-1">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-950">
              今後の予約
            </h2>
            <p className="text-sm text-slate-500">
              予約済みのレッスンを確認できます。
            </p>
          </div>
          <Link
            href="/student/reservations/new"
            className={buttonVariants({
              variant: "ghost",
              className:
                "rounded-full px-4 text-sm font-semibold text-slate-500 hover:bg-emerald-50 hover:text-emerald-700",
            })}
          >
            予約する
          </Link>
        </div>
        {upcomingReservations?.length ? (
          <div className="grid gap-4">
            {upcomingReservations.map((reservation) => {
              const location = Array.isArray(reservation.location)
                ? reservation.location[0]
                : reservation.location;

              return (
                <article
                  key={reservation.id}
                  className="rounded-[24px] border border-emerald-100 bg-white px-5 py-5 shadow-[0_12px_30px_rgba(15,31,46,0.06)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold tracking-tight text-slate-950">
                        {formatReservationAt(reservation.scheduled_at)}
                      </h3>
                      <p className="text-sm text-slate-600">
                        所要時間: {reservation.duration_minutes ?? 60}分
                        {location?.name ? ` / ${location.name}` : ""}
                      </p>
                    </div>
                    <ReservationStatusBadge status={reservation.status} />
                  </div>
                  <div className="mt-4 flex justify-end">
                    <CancelReservationButton
                      reservationId={reservation.id}
                      scheduledAt={reservation.scheduled_at}
                      deadlineHours={school?.cancellation_deadline_hours ?? 24}
                      lateCancellationPolicy={
                        (school?.late_cancellation_policy as
                          | "consume"
                          | "no_cancel"
                          | undefined) ?? "consume"
                      }
                    />
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[24px] border border-dashed border-emerald-200 bg-white/85 px-6 py-8 text-center shadow-[0_12px_30px_rgba(15,31,46,0.04)]">
            <p className="text-lg font-semibold text-slate-900">
              まだ今後の予約はありません
            </p>
            <p className="mt-2 text-sm leading-7 text-slate-500">
              新しい予約を追加すると、ここに表示されます。
            </p>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">
            最近の連絡帳
            <span className="ml-2 text-emerald-500">
              {lessons?.length ?? 0}件
            </span>
          </h2>
          <span className="text-sm font-medium text-slate-500">すべて見る →</span>
        </div>

        <div className="grid gap-4">
          {lessons?.length ? (
            lessons.map((lesson, index) => (
              <Link
                key={lesson.id}
                href={`/lessons/${lesson.id}`}
                className={cn(
                  "group relative overflow-hidden rounded-[28px] border bg-white px-5 py-5 shadow-[0_12px_30px_rgba(15,31,46,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,31,46,0.09)]",
                  index === 0
                    ? "border-emerald-200 bg-[linear-gradient(135deg,#ffffff_0%,#f3fcf7_100%)]"
                    : "border-slate-100"
                )}
              >
                {index === 0 ? (
                  <>
                    <span className="absolute left-0 top-8 h-24 w-1 rounded-r bg-emerald-400" />
                    <span className="absolute right-5 top-5 h-3 w-3 rounded-full bg-emerald-300 shadow-[0_0_0_6px_rgba(125,224,176,0.18)]" />
                  </>
                ) : null}
                <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-500">
                  <span className="rounded-xl bg-emerald-50 px-3 py-1 text-emerald-700">
                    第{(lessons?.length ?? 0) - index + 11}回
                  </span>
                  <span>{formatRecordedAt(lesson.recorded_at)}</span>
                  <span className="text-emerald-600">音声あり</span>
                </div>
                <h3 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-slate-950">
                  レッスンノートを確認しましょう
                </h3>
                <p className="mt-3 text-base leading-8 text-slate-600">
                  {formatDuration(lesson.duration_seconds)}
                  の記録と、先生から届いた学びのまとめを確認できます。
                </p>
                <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4 text-sm text-slate-500">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-200 to-orange-300 font-bold text-white">
                    田
                  </span>
                  <span>
                    <strong className="font-semibold text-slate-800">
                      田中先生
                    </strong>
                    から
                  </span>
                </div>
              </Link>
            ))
          ) : (
            <div className="rounded-[24px] border border-dashed border-emerald-200 bg-white/85 px-6 py-8 text-center shadow-[0_12px_30px_rgba(15,31,46,0.04)]">
              <p className="text-lg font-semibold text-slate-900">
                まだ見られるレッスンノートはありません
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                先生から送信されたレッスンがここに並びます。
              </p>
            </div>
          )}
        </div>
      </section>

      <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-md items-center justify-around border-t border-slate-100 bg-white/88 px-4 pb-6 pt-3 backdrop-blur-xl sm:max-w-none sm:px-6">
        {[
          {
            href: "/student/dashboard",
            label: "連絡帳",
            icon: BookOpenText,
            active: true,
          },
          { href: "/student/reservations/new", label: "予約", icon: CalendarDays },
          { href: "/", label: "教室", icon: School2 },
          { href: "/student/dashboard", label: "マイ", icon: CircleUserRound },
        ].map(({ href, label, icon: Icon, active }) => (
          <Link
            key={label}
            href={href}
            className={cn(
              "flex min-w-[72px] flex-col items-center gap-1 rounded-2xl px-3 py-2 text-[11px] font-semibold transition",
              active ? "text-emerald-500" : "text-slate-500"
            )}
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
