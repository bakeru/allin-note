import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Clock3,
  MapPin,
  Mic,
  Send,
} from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getTeacherWorkspaceUser } from "@/lib/auth/teacher-access";
import { formatJstDateTimeLabel, formatJstTimeLabel } from "@/lib/reservations/jst";
import { createServiceClient } from "@/lib/supabase/service";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type StudentRow = {
  user_id: string;
  profile:
    | {
        display_name: string;
      }
    | Array<{
        display_name: string;
      }>
    | null;
};

type TeacherSummary = {
  lesson_flow?: string;
  teaching_highlights?: string[];
  observations?: string[];
  questions_for_reflection?: string[];
};

type LessonRow = {
  id: string;
  student_id: string;
  recorded_at: string;
  sent_at?: string | null;
  teacher_message?: string | null;
  summary_for_teacher?: TeacherSummary | string | null;
};

type ReservationRow = {
  id: string;
  student_id: string;
  scheduled_at: string;
  duration_minutes?: number | null;
  status?: string | null;
  location:
    | {
        name?: string | null;
      }
    | Array<{
        name?: string | null;
      }>
    | null;
};

const extractStudentName = (student: StudentRow) => {
  const profile = Array.isArray(student.profile)
    ? student.profile[0]
    : student.profile;

  return profile?.display_name ?? "生徒";
};

const extractLocationName = (reservation: ReservationRow) => {
  const location = Array.isArray(reservation.location)
    ? reservation.location[0]
    : reservation.location;

  return location?.name ?? "";
};

const parseTeacherSummary = (
  summary: LessonRow["summary_for_teacher"]
): TeacherSummary | null => {
  if (!summary) {
    return null;
  }

  if (typeof summary === "string") {
    try {
      return JSON.parse(summary) as TeacherSummary;
    } catch {
      return null;
    }
  }

  return summary;
};

const isActiveReservation = (status: string | null | undefined) =>
  !status?.startsWith("cancelled") && status !== "completed";

export default async function TeacherStudentKarteDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const user = await getTeacherWorkspaceUser();

  if (!user) {
    redirect("/");
  }

  const supabase = createServiceClient();
  const nowIso = new Date().toISOString();

  const [
    { data: student, error: studentError },
    { data: lessons, error: lessonsError },
    { data: reservations, error: reservationsError },
  ] = await Promise.all([
    supabase
      .from("students")
      .select(
        `
          user_id,
          profile:profiles!user_id(display_name)
        `
      )
      .eq("teacher_id", user.id)
      .eq("user_id", studentId)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("lessons")
      .select(
        "id, student_id, recorded_at, sent_at, teacher_message, summary_for_teacher"
      )
      .eq("teacher_id", user.id)
      .eq("student_id", studentId)
      .order("recorded_at", { ascending: false }),
    supabase
      .from("reservations")
      .select(
        `
          id,
          student_id,
          scheduled_at,
          duration_minutes,
          status,
          location:locations(name)
        `
      )
      .eq("teacher_id", user.id)
      .eq("student_id", studentId)
      .order("scheduled_at", { ascending: true }),
  ]);

  if (studentError) {
    throw new Error(studentError.message);
  }

  if (lessonsError) {
    throw new Error(lessonsError.message);
  }

  if (reservationsError) {
    throw new Error(reservationsError.message);
  }

  if (!student) {
    notFound();
  }

  const typedStudent = student as StudentRow;
  const typedLessons = (lessons ?? []) as LessonRow[];
  const typedReservations = (reservations ?? []) as ReservationRow[];
  const studentName = extractStudentName(typedStudent);
  const nextReservation =
    typedReservations.find(
      (reservation) =>
        isActiveReservation(reservation.status) && reservation.scheduled_at >= nowIso
    ) ?? null;
  const unsentCount = typedLessons.filter((lesson) => !lesson.sent_at).length;

  return (
    <div className="min-h-screen bg-[#f7faf8] px-5 py-6 md:mx-auto md:max-w-5xl md:px-6 md:py-8">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3 md:mb-8">
        <div>
          <Link
            href="/karte"
            className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition hover:text-[#1D9E75]"
          >
            <ArrowLeft className="h-4 w-4" />
            カルテ一覧へ戻る
          </Link>
          <p className="mt-4 text-[11px] font-semibold tracking-[0.22em] text-[#1D9E75]">
            STUDENT KARTE
          </p>
          <h1 className="mt-2 text-[2rem] font-semibold tracking-tight text-slate-900 md:text-3xl">
            {studentName}さんのカルテ
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            これまでのレッスン記録と、次にやることをまとめています。
          </p>
        </div>

        <div className="flex w-full gap-2 sm:w-auto">
          <Link
            href={`/record/student/${studentId}`}
            className={cn(
              buttonVariants({ variant: "default" }),
              "flex-1 rounded-2xl bg-[#1D9E75] text-white hover:bg-[#0F6E56] sm:flex-none"
            )}
          >
            <Mic className="mr-1 h-4 w-4" />
            この生徒を録音
          </Link>
          <Link
            href="/reservations"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "flex-1 rounded-2xl border-slate-200 bg-white sm:flex-none"
            )}
          >
            予約を見る
          </Link>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-2 md:grid-cols-4">
        <DetailMetric label="レッスン履歴" value={typedLessons.length} unit="件" />
        <DetailMetric label="送信待ち" value={unsentCount} unit="件" tone="warn" />
        <DetailMetric
          label="次の予定"
          value={nextReservation ? formatJstTimeLabel(new Date(nextReservation.scheduled_at)) : "--:--"}
          unit={nextReservation ? "" : ""}
        />
        <DetailMetric
          label="最新記録"
          value={
            typedLessons[0]
              ? new Intl.DateTimeFormat("ja-JP", {
                  month: "numeric",
                  day: "numeric",
                }).format(new Date(typedLessons[0].recorded_at))
              : "--"
          }
          unit={typedLessons[0] ? "" : ""}
        />
      </div>

      {nextReservation ? (
        <Card className="mb-6 rounded-[24px] border border-[#d9eee6] bg-[#E1F5EE] shadow-[0_12px_30px_rgba(29,158,117,0.08)]">
          <CardContent className="p-5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-[#0F6E56]">次のレッスン</p>
              <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-[#1D9E75]">
                予定あり
              </span>
            </div>
            <p className="text-lg font-semibold text-[#04342C]">
              {formatJstDateTimeLabel(new Date(nextReservation.scheduled_at))}
            </p>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-[#0F6E56]">
              <span className="inline-flex items-center gap-1">
                <Clock3 className="h-3.5 w-3.5" />
                {nextReservation.duration_minutes ?? 60}分
              </span>
              {extractLocationName(nextReservation) ? (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {extractLocationName(nextReservation)}
                </span>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">レッスン履歴</h2>
          <span className="text-[11px] font-medium text-slate-400">
            新しい順
          </span>
        </div>

        {typedLessons.length ? (
          typedLessons.map((lesson) => {
            const teacherSummary = parseTeacherSummary(lesson.summary_for_teacher);
            const highlights = [
              ...(teacherSummary?.teaching_highlights ?? []),
              ...(teacherSummary?.observations ?? []),
            ].slice(0, 3);
            const isUnsent = !lesson.sent_at;

            return (
              <Link
                key={lesson.id}
                href={`/lessons/${lesson.id}/edit`}
                className={cn(
                  "block rounded-[24px] border p-4 shadow-[0_12px_30px_rgba(15,23,42,0.04)] transition hover:border-[#9FE1CB] hover:bg-[#fbfefd]",
                  isUnsent
                    ? "border-[#f8d7b8] bg-[#fff8f1]"
                    : "border-slate-200 bg-white"
                )}
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {formatJstDateTimeLabel(new Date(lesson.recorded_at))}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {isUnsent
                        ? "まだ生徒へ送信していません"
                        : `送信済み: ${formatJstDateTimeLabel(new Date(lesson.sent_at!))}`}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold",
                      isUnsent
                        ? "bg-[#fff1e7] text-[#dd6b20]"
                        : "bg-[#E1F5EE] text-[#1D9E75]"
                    )}
                  >
                    {isUnsent ? (
                      <Send className="h-3 w-3" />
                    ) : (
                      <CheckCircle2 className="h-3 w-3" />
                    )}
                    {isUnsent ? "送信待ち" : "送信済み"}
                  </span>
                </div>

                {highlights.length ? (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {highlights.map((item) => (
                      <span
                        key={`${lesson.id}-${item}`}
                        className="rounded-full bg-[#f4fbf8] px-2.5 py-1 text-[11px] font-medium text-[#0F6E56]"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="flex items-start justify-between gap-3">
                  <p className="line-clamp-3 text-xs leading-5 text-slate-500">
                    {lesson.teacher_message?.trim()
                      ? lesson.teacher_message
                      : "先生からのひとことはまだ入力されていません。タップして編集画面で整えられます。"}
                  </p>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-400">
                    <ChevronRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            );
          })
        ) : (
          <Card className="rounded-[24px] border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
            <CardContent className="space-y-4 py-8 text-sm leading-6 text-slate-500">
              <p>まだこの生徒のレッスン記録はありません。録音を始めるとここに履歴が並びます。</p>
              <Link href={`/record/student/${studentId}`} className={buttonVariants({ variant: "outline" })}>
                録音を始める
              </Link>
            </CardContent>
          </Card>
        )}
      </section>

      {typedReservations.length ? (
        <section className="mt-8 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">予約一覧</h2>
            <span className="text-[11px] font-medium text-slate-400">
              {typedReservations.length}件
            </span>
          </div>
          <div className="space-y-3">
            {typedReservations.slice(0, 6).map((reservation) => (
              <Card
                key={reservation.id}
                className="rounded-[22px] border border-slate-200 bg-white shadow-[0_8px_20px_rgba(15,23,42,0.03)]"
              >
                <CardContent className="flex items-start justify-between gap-3 p-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {formatJstDateTimeLabel(new Date(reservation.scheduled_at))}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="h-3.5 w-3.5" />
                        {reservation.duration_minutes ?? 60}分
                      </span>
                      {extractLocationName(reservation) ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {extractLocationName(reservation)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[10px] font-semibold",
                      isActiveReservation(reservation.status)
                        ? "bg-[#E1F5EE] text-[#1D9E75]"
                        : "bg-slate-100 text-slate-500"
                    )}
                  >
                    {isActiveReservation(reservation.status) ? "予定あり" : "完了/取消"}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function DetailMetric({
  label,
  value,
  unit,
  tone = "default",
}: {
  label: string;
  value: number | string;
  unit: string;
  tone?: "default" | "warn";
}) {
  return (
    <Card className="rounded-[22px] border border-slate-200 bg-white shadow-[0_8px_20px_rgba(15,23,42,0.03)]">
      <CardContent className="p-4">
        <p className="text-[11px] font-medium text-slate-500">{label}</p>
        <p
          className={cn(
            "mt-1 text-xl font-semibold",
            tone === "warn" ? "text-[#dd6b20]" : "text-slate-900"
          )}
        >
          {value}
          {unit ? (
            <span className="ml-0.5 text-[11px] font-normal text-slate-400">
              {unit}
            </span>
          ) : null}
        </p>
      </CardContent>
    </Card>
  );
}
