import Link from "next/link";

import { CancelReservationButton } from "@/components/reservations/cancel-reservation-button";
import { ReservationStatusBadge } from "@/components/reservations/reservation-status-badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { createServiceClient } from "@/lib/supabase/service";

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

  const school = Array.isArray(student?.school) ? student.school[0] : student?.school;

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl flex-col px-5 py-10">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
          こんにちは、{user.display_name}さん
        </h1>
        <p className="text-base leading-7 text-slate-600">
          これまでのレッスンノートを確認できます。
        </p>
      </div>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-sky-100 bg-white/95 p-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">
            次回のレッスンを予約
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            空いている時間から選んで、そのまま予約できます。
          </p>
        </div>
        <Link
          href="/student/reservations/new"
          className={buttonVariants({
            size: "lg",
            className: "bg-sky-600 text-white hover:bg-sky-700",
          })}
        >
          予約する
        </Link>
      </div>

      <section className="mb-8 space-y-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-slate-950">今後の予約</h2>
          <p className="text-sm text-slate-600">
            予約済みのレッスンとキャンセル状況を確認できます。
          </p>
        </div>
        {upcomingReservations?.length ? (
          <div className="grid gap-4">
            {upcomingReservations.map((reservation) => {
              const location = Array.isArray(reservation.location)
                ? reservation.location[0]
                : reservation.location;

              return (
                <Card
                  key={reservation.id}
                  className="border border-sky-100 bg-white/95 ring-0"
                >
                  <CardHeader>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <CardTitle className="text-xl text-slate-950">
                          {formatReservationAt(reservation.scheduled_at)}
                        </CardTitle>
                        <CardDescription className="text-sm text-slate-600">
                          所要時間: {reservation.duration_minutes ?? 60}分
                          {location?.name ? ` / ${location.name}` : ""}
                        </CardDescription>
                      </div>
                      <ReservationStatusBadge status={reservation.status} />
                    </div>
                  </CardHeader>
                  <CardContent className="flex justify-end">
                    <CancelReservationButton
                      reservationId={reservation.id}
                      scheduledAt={reservation.scheduled_at}
                      deadlineHours={school?.cancellation_deadline_hours ?? 24}
                      lateCancellationPolicy={
                        (school?.late_cancellation_policy as "consume" | "no_cancel" | undefined) ??
                        "consume"
                      }
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border border-sky-100 bg-white/95 ring-0">
            <CardHeader>
              <CardTitle className="text-xl text-slate-950">
                まだ今後の予約はありません
              </CardTitle>
              <CardDescription className="text-base leading-7 text-slate-600">
                新しい予約を追加すると、ここに表示されます。
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </section>

      <div className="grid gap-4">
        {lessons?.length ? (
          lessons.map((lesson) => (
            <Card
              key={lesson.id}
              className="border border-sky-100 bg-white/95 ring-0"
            >
              <CardHeader>
                <CardTitle className="text-xl text-slate-950">
                  {formatRecordedAt(lesson.recorded_at)}
                </CardTitle>
                <CardDescription className="text-sm text-slate-600">
                  レッスン時間: {formatDuration(lesson.duration_seconds)}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-end">
                <Link
                  href={`/lessons/${lesson.id}`}
                  className={buttonVariants({
                    className: "bg-sky-600 text-white hover:bg-sky-700",
                  })}
                >
                  見る
                </Link>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="border border-sky-100 bg-white/95 ring-0">
            <CardHeader>
              <CardTitle className="text-xl text-slate-950">
                まだ見られるレッスンノートはありません
              </CardTitle>
              <CardDescription className="text-base leading-7 text-slate-600">
                先生から送信されたレッスンがここに並びます。
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </div>
  );
}
