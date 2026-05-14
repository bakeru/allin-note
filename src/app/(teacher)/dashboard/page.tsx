import Link from "next/link";
import { redirect } from "next/navigation";

import {
  TeacherMobileHome,
  type TeacherHomeLesson,
  type TeacherHomeTodo,
} from "@/components/teacher/teacher-mobile-home";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getTeacherWorkspaceUser } from "@/lib/auth/teacher-access";
import {
  addDaysToDateKey,
  createDateFromDateKey,
  formatJstDateKey,
  formatJstDateTimeLabel,
} from "@/lib/reservations/jst";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

type LessonRow = {
  id: string;
  recorded_at: string;
  sent_at?: string | null;
  teacher_message?: string | null;
  student?:
    | {
        profile:
          | {
              display_name: string;
            }
          | Array<{
              display_name: string;
            }>
          | null;
      }
    | Array<{
        profile:
          | {
              display_name: string;
            }
          | Array<{
              display_name: string;
            }>
          | null;
      }>
    | null;
};

type ReservationRow = {
  id: string;
  scheduled_at: string;
  duration_minutes: number | null;
  status: string | null;
  location:
    | {
        name?: string | null;
      }
    | Array<{
        name?: string | null;
      }>
    | null;
  student:
    | {
        profile:
          | {
              display_name: string;
            }
          | Array<{
              display_name: string;
            }>
          | null;
      }
    | Array<{
        profile:
          | {
              display_name: string;
            }
          | Array<{
              display_name: string;
            }>
          | null;
      }>
    | null;
};

const formatRecordedAt = (value: string) =>
  new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const formatSentAt = (value: string) =>
  new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const extractStudentName = (lesson: LessonRow | ReservationRow) => {
  const student = Array.isArray(lesson.student) ? lesson.student[0] : lesson.student;
  const profile = Array.isArray(student?.profile)
    ? student.profile[0]
    : student?.profile;

  return profile?.display_name ?? "生徒";
};

const extractLocationName = (reservation: ReservationRow) => {
  const location = Array.isArray(reservation.location)
    ? reservation.location[0]
    : reservation.location;

  return location?.name ?? "";
};

const isCancelledStatus = (status: string | null | undefined) =>
  (status ?? "").startsWith("cancelled");

const isActionableReservation = (reservation: ReservationRow) =>
  !isCancelledStatus(reservation.status) && reservation.status !== "completed";

const toHomeLesson = (reservation: ReservationRow): TeacherHomeLesson => ({
  id: reservation.id,
  scheduledAt: reservation.scheduled_at,
  durationMinutes: reservation.duration_minutes ?? 60,
  studentName: extractStudentName(reservation),
  locationName: extractLocationName(reservation),
  status: reservation.status ?? "scheduled",
});

const getGreeting = (date: Date) => {
  const hour = Number(
    new Intl.DateTimeFormat("ja-JP", {
      timeZone: "Asia/Tokyo",
      hour: "2-digit",
      hour12: false,
    }).format(date)
  );

  if (hour < 12) {
    return "おはようございます";
  }

  if (hour < 18) {
    return "こんにちは";
  }

  return "こんばんは";
};

function LessonCard({
  lesson,
  tone = "unsent",
}: {
  lesson: LessonRow;
  tone?: "unsent" | "sent";
}) {
  return (
    <Card className="rounded-lg border-0 bg-white ring-1 ring-neutral-200">
      <CardHeader>
        <CardTitle className="text-xl text-neutral-950">
          {extractStudentName(lesson)}さん
        </CardTitle>
        <CardDescription className="text-sm text-neutral-600">
          録音日時: {formatRecordedAt(lesson.recorded_at)}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1 text-sm text-neutral-600">
          <p>
            メッセージ: {lesson.teacher_message?.trim() ? "入力済み" : "未入力"}
          </p>
          {tone === "sent" && lesson.sent_at ? (
            <p>送信日時: {formatSentAt(lesson.sent_at)}</p>
          ) : null}
        </div>
        <Link
          href={`/lessons/${lesson.id}/edit`}
          className={buttonVariants({
            variant: tone === "sent" ? "outline" : "default",
          })}
        >
          編集する
        </Link>
      </CardContent>
    </Card>
  );
}

export default async function TeacherDashboardPage() {
  const user = await getTeacherWorkspaceUser();

  if (!user) {
    redirect("/");
  }

  const supabase = createServiceClient();
  const now = new Date();
  const nowIso = now.toISOString();
  const todayDateKey = formatJstDateKey(now);
  const tomorrowDateKey = addDaysToDateKey(todayDateKey, 1);
  const startOfToday = createDateFromDateKey(todayDateKey, 0, 0);
  const startOfTomorrow = createDateFromDateKey(tomorrowDateKey, 0, 0);

  const [
    { data: unsent, error: unsentError },
    { data: sent, error: sentError },
    { data: todayReservations, error: todayReservationsError },
    { data: upcomingReservations, error: upcomingReservationsError },
  ] = await Promise.all([
    supabase
      .from("lessons")
      .select(
        `
          *,
          student:students!inner(
            profile:profiles!user_id(display_name)
          )
        `
      )
      .eq("teacher_id", user.id)
      .eq("status", "ready")
      .is("sent_at", null)
      .order("recorded_at", { ascending: false }),
    supabase
      .from("lessons")
      .select(
        `
          *,
          student:students!inner(
            profile:profiles!user_id(display_name)
          )
        `
      )
      .eq("teacher_id", user.id)
      .eq("status", "ready")
      .not("sent_at", "is", null)
      .order("sent_at", { ascending: false })
      .limit(10),
    supabase
      .from("reservations")
      .select(
        `
          id,
          scheduled_at,
          duration_minutes,
          status,
          location:locations(name),
          student:students!inner(
            profile:profiles!user_id(display_name)
          )
        `
      )
      .eq("teacher_id", user.id)
      .gte("scheduled_at", startOfToday.toISOString())
      .lt("scheduled_at", startOfTomorrow.toISOString())
      .order("scheduled_at", { ascending: true }),
    supabase
      .from("reservations")
      .select(
        `
          id,
          scheduled_at,
          duration_minutes,
          status,
          location:locations(name),
          student:students!inner(
            profile:profiles!user_id(display_name)
          )
        `
      )
      .eq("teacher_id", user.id)
      .gte("scheduled_at", nowIso)
      .order("scheduled_at", { ascending: true })
      .limit(8),
  ]);

  if (unsentError) {
    throw new Error(unsentError.message);
  }

  if (sentError) {
    throw new Error(sentError.message);
  }

  if (
    todayReservationsError &&
    !todayReservationsError.message.includes("public.reservations")
  ) {
    throw new Error(todayReservationsError.message);
  }

  if (
    upcomingReservationsError &&
    !upcomingReservationsError.message.includes("public.reservations")
  ) {
    throw new Error(upcomingReservationsError.message);
  }

  const typedTodayReservations = (todayReservations ?? []) as ReservationRow[];
  const typedUpcomingReservations = (upcomingReservations ?? []) as ReservationRow[];

  const nonCancelledToday = typedTodayReservations.filter(
    (reservation) => !isCancelledStatus(reservation.status)
  );
  const actionableToday = typedTodayReservations.filter(isActionableReservation);
  const actionableUpcoming = typedUpcomingReservations.filter(
    isActionableReservation
  );

  const currentOrNextToday =
    actionableToday.find((reservation) => {
      const start = new Date(reservation.scheduled_at);
      const end = new Date(
        start.getTime() + (reservation.duration_minutes ?? 60) * 60 * 1000
      );

      return now >= start && now < end;
    }) ??
    actionableToday.find(
      (reservation) => new Date(reservation.scheduled_at).getTime() >= now.getTime()
    ) ??
    nonCancelledToday[0] ??
    null;

  const nextFutureLesson =
    actionableUpcoming.find(
      (reservation) => new Date(reservation.scheduled_at).getTime() >= now.getTime()
    ) ?? null;

  const todoItems: TeacherHomeTodo[] = [];

  if ((unsent?.length ?? 0) > 0) {
    todoItems.push({
      href: "/dashboard",
      title: `送信待ちのノートが${unsent?.length ?? 0}件あります`,
      description: "今日の振り返りを整えて、生徒へ届けましょう。",
      kind: "unsent",
    });
  }

  todoItems.push(
    nonCancelledToday.length > 0
      ? {
          href: "/reservations",
          title: "今日のレッスンを確認する",
          description: `本日の予約は${nonCancelledToday.length}件あります。時刻順に見直せます。`,
          kind: "schedule" as const,
        }
      : nextFutureLesson
        ? {
            href: "/reservations",
            title: "次のレッスンを確認する",
            description: `${formatJstDateTimeLabel(
              new Date(nextFutureLesson.scheduled_at)
            )}から始まります。`,
            kind: "schedule" as const,
          }
        : {
            href: "/reservations/new",
            title: "新しい予約を追加する",
            description: "先の予定を入れておくと、録音をすぐ始められます。",
            kind: "schedule" as const,
          }
  );

  todoItems.push({
    href: "/record/select-student",
    title: "予約なしで録音を始める",
    description: "その場で生徒を選び、すぐ録音に入れます。",
    kind: "record",
  });

  return (
    <>
      <TeacherMobileHome
        displayName={user.display_name}
        greeting={getGreeting(now)}
        currentTimeIso={nowIso}
        todayLessonCount={nonCancelledToday.length}
        unsentCount={unsent?.length ?? 0}
        highlightedLesson={currentOrNextToday ? toHomeLesson(currentOrNextToday) : null}
        nextLesson={nextFutureLesson ? toHomeLesson(nextFutureLesson) : null}
        todoItems={todoItems}
      />

      <div className="mx-auto hidden min-h-[calc(100vh-4rem)] w-full max-w-5xl flex-col gap-8 px-5 py-8 md:flex">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-neutral-950">ダッシュボード</h1>
          <p className="text-sm leading-6 text-neutral-600">
            未送信のレッスンを確認して、生徒・保護者へ届けるメッセージを後から落ち着いて入力できます。
          </p>
        </div>

        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold text-neutral-950">未送信のレッスン</h2>
            <p className="text-sm text-neutral-600">
              要約ができていて、まだ送信していないレッスンです。
            </p>
          </div>

          {unsent?.length ? (
            <div className="grid gap-4">
              {unsent.map((lesson) => (
                <LessonCard key={lesson.id} lesson={lesson as LessonRow} />
              ))}
            </div>
          ) : (
            <Card className="rounded-lg border-0 bg-white ring-1 ring-neutral-200">
              <CardHeader>
                <CardTitle className="text-xl text-neutral-950">
                  未送信のレッスンはありません
                </CardTitle>
                <CardDescription className="text-base leading-7 text-neutral-600">
                  新しい録音をすると、要約完了後にここへ並びます。
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </section>

        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold text-neutral-950">最近送信したレッスン</h2>
            <p className="text-sm text-neutral-600">最新10件を表示しています。</p>
          </div>

          {sent?.length ? (
            <div className="grid gap-4">
              {sent.map((lesson) => (
                <LessonCard key={lesson.id} lesson={lesson as LessonRow} tone="sent" />
              ))}
            </div>
          ) : (
            <Card className="rounded-lg border-0 bg-white ring-1 ring-neutral-200">
              <CardHeader>
                <CardTitle className="text-xl text-neutral-950">
                  まだ送信したレッスンはありません
                </CardTitle>
                <CardDescription className="text-base leading-7 text-neutral-600">
                  「保存して送信」を押したレッスンがここに移動します。
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </section>
      </div>
    </>
  );
}
