import Link from "next/link";
import { redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { CancelReservationButton } from "@/components/reservations/cancel-reservation-button";
import { ReservationStatusBadge } from "@/components/reservations/reservation-status-badge";
import {
  TeacherMobileLessons,
  type TeacherLessonNote,
  type TeacherLessonReservation,
} from "@/components/teacher/teacher-mobile-lessons";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getTeacherWorkspaceUser } from "@/lib/auth/teacher-access";
import { createServiceClient } from "@/lib/supabase/service";
import { cn } from "@/lib/utils";

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
  notes: string | null;
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

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("ja-JP", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const extractName = (reservation: ReservationRow) => {
  const student = Array.isArray(reservation.student)
    ? reservation.student[0]
    : reservation.student;
  const profile = Array.isArray(student?.profile)
    ? student.profile[0]
    : student?.profile;

  return profile?.display_name ?? "生徒";
};

const extractStudentNameFromRelation = (studentRelation: LessonRow["student"]) => {
  const student = Array.isArray(studentRelation) ? studentRelation[0] : studentRelation;
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

const toLessonNote = (lesson: LessonRow): TeacherLessonNote => ({
  id: lesson.id,
  recordedAt: lesson.recorded_at,
  sentAt: lesson.sent_at ?? null,
  teacherMessage: lesson.teacher_message ?? null,
  studentName: extractStudentNameFromRelation(lesson.student),
});

const toLessonReservation = (
  reservation: ReservationRow
): TeacherLessonReservation => ({
  id: reservation.id,
  scheduledAt: reservation.scheduled_at,
  durationMinutes: reservation.duration_minutes ?? 60,
  status: reservation.status ?? "scheduled",
  notes: reservation.notes ?? null,
  locationName: extractLocationName(reservation),
  studentName: extractName(reservation),
});

function ReservationCard({ reservation }: { reservation: ReservationRow }) {
  const status = reservation.status ?? "scheduled";
  const isCancelled = status.startsWith("cancelled");
  const isCompleted = status === "completed";

  return (
    <Card
      className={cn(
        "rounded-lg border-0 ring-1 transition",
        isCompleted || isCancelled
          ? "bg-neutral-50 ring-neutral-200"
          : "bg-white ring-neutral-200"
      )}
    >
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-lg">
              {extractName(reservation)}さん
            </CardTitle>
            <p className="text-sm text-neutral-600">
              {formatDateTime(reservation.scheduled_at)}
            </p>
          </div>
          <ReservationStatusBadge status={reservation.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-neutral-700">
        <p>所要時間: {reservation.duration_minutes ?? 60}分</p>
        {extractLocationName(reservation) ? (
          <p>場所: {extractLocationName(reservation)}</p>
        ) : null}
        {reservation.notes ? <p>メモ: {reservation.notes}</p> : null}
        {status === "scheduled" ? (
          <div className="flex justify-end gap-2 pt-2">
            <Link
              href={`/reservations/${reservation.id}/edit`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              編集
            </Link>
            <CancelReservationButton
              reservationId={reservation.id}
              scheduledAt={reservation.scheduled_at}
              deadlineHours={24}
              lateCancellationPolicy="consume"
              variant="ghost"
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default async function ReservationsPage() {
  const user = await getTeacherWorkspaceUser();

  if (!user) {
    redirect("/");
  }

  const supabase = createServiceClient();
  const nowIso = new Date().toISOString();

  const [
    { data: upcomingReservations, error: upcomingError },
    { data: pastReservations, error: pastError },
    { data: unsentLessons, error: unsentLessonsError },
    { data: sentLessons, error: sentLessonsError },
  ] = await Promise.all([
      supabase
        .from("reservations")
        .select(
          `
            id,
            scheduled_at,
            duration_minutes,
            status,
            notes,
            location:locations(name),
            student:students!inner(
              profile:profiles!user_id(display_name)
            )
          `
        )
        .eq("teacher_id", user.id)
        .gte("scheduled_at", nowIso)
        .order("scheduled_at", { ascending: true }),
      supabase
        .from("reservations")
        .select(
          `
            id,
            scheduled_at,
            duration_minutes,
            status,
            notes,
            location:locations(name),
            student:students!inner(
              profile:profiles!user_id(display_name)
            )
          `
        )
        .eq("teacher_id", user.id)
        .lt("scheduled_at", nowIso)
        .order("scheduled_at", { ascending: false })
        .limit(10),
      supabase
        .from("lessons")
        .select(
          `
            id,
            recorded_at,
            sent_at,
            teacher_message,
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
            id,
            recorded_at,
            sent_at,
            teacher_message,
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
    ]);

  if (upcomingError) {
    if (upcomingError.message.includes("public.reservations")) {
      return (
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl flex-col gap-8 px-5 py-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold text-neutral-950">予約</h1>
              <p className="text-sm leading-6 text-neutral-600">
                予約機能を使う前に、Supabaseへ追加マイグレーションを流してください。
              </p>
            </div>
          </div>

          <Card className="rounded-lg border-0 bg-white ring-1 ring-neutral-200">
            <CardContent className="space-y-3 py-8 text-sm leading-6 text-neutral-700">
              <p>
                `supabase/migrations/20260424120000_add_reservations.sql` を
                Supabase SQL Editor で実行すると、この画面が使えるようになります。
              </p>
              <p>
                実行後に `npm run dev` を再起動すると、予約一覧と録音時の自動紐付けが有効になります。
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    throw new Error(upcomingError.message);
  }

  if (pastError) {
    throw new Error(pastError.message);
  }

  if (unsentLessonsError) {
    throw new Error(unsentLessonsError.message);
  }

  if (sentLessonsError) {
    throw new Error(sentLessonsError.message);
  }

  return (
    <>
      <TeacherMobileLessons
        upcomingReservations={(upcomingReservations ?? []).map((reservation) =>
          toLessonReservation(reservation as ReservationRow)
        )}
        pastReservations={(pastReservations ?? []).map((reservation) =>
          toLessonReservation(reservation as ReservationRow)
        )}
        unsentLessons={(unsentLessons ?? []).map((lesson) =>
          toLessonNote(lesson as LessonRow)
        )}
        sentLessons={(sentLessons ?? []).map((lesson) =>
          toLessonNote(lesson as LessonRow)
        )}
      />

      <div className="mx-auto hidden min-h-[calc(100vh-4rem)] w-full max-w-5xl flex-col gap-8 px-5 py-8 md:flex">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-neutral-950">予約</h1>
          <p className="text-sm leading-6 text-neutral-600">
            録音前に生徒を迷わず選べるよう、直近の予約をここで整えます。
          </p>
        </div>
        <Link href="/reservations/new" className={buttonVariants({ size: "lg" })}>
          + 新しい予約を追加
        </Link>
      </div>

      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-neutral-950">今後の予約</h2>
          <p className="text-sm text-neutral-600">日時が近い順に並んでいます。</p>
        </div>
        {upcomingReservations?.length ? (
          <div className="grid gap-4">
            {upcomingReservations.map((reservation) => (
              <ReservationCard key={reservation.id} reservation={reservation as ReservationRow} />
            ))}
          </div>
        ) : (
          <Card className="rounded-lg border-0 bg-white ring-1 ring-neutral-200">
            <CardContent className="py-8 text-sm text-neutral-600">
              まだ今後の予約はありません。録音前にひとつ作っておくと、自動で生徒に紐付きます。
            </CardContent>
          </Card>
        )}
      </section>

      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-neutral-950">過去の予約</h2>
          <p className="text-sm text-neutral-600">直近10件を表示しています。</p>
        </div>
        {pastReservations?.length ? (
          <div className="grid gap-4">
            {pastReservations.map((reservation) => (
              <ReservationCard key={reservation.id} reservation={reservation as ReservationRow} />
            ))}
          </div>
        ) : (
          <Card className="rounded-lg border-0 bg-neutral-100/80 ring-1 ring-neutral-200">
            <CardContent className="py-8 text-sm text-neutral-600">
              過去の予約はまだありません。
            </CardContent>
          </Card>
        )}
      </section>
      </div>
    </>
  );
}
