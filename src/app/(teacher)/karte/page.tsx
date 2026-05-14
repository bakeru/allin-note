import Link from "next/link";
import { BookOpenText, ChevronRight, Clock3, FileText, Mic, Users } from "lucide-react";
import { redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getTeacherWorkspaceUser } from "@/lib/auth/teacher-access";
import { formatJstDateTimeLabel } from "@/lib/reservations/jst";
import { createServiceClient } from "@/lib/supabase/service";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type StudentRow = {
  user_id: string;
  created_at?: string | null;
  profile:
    | {
        display_name: string;
      }
    | Array<{
        display_name: string;
      }>
    | null;
};

type LessonRow = {
  id: string;
  student_id: string;
  recorded_at: string;
  sent_at?: string | null;
  teacher_message?: string | null;
};

type ReservationRow = {
  id: string;
  student_id: string;
  scheduled_at: string;
  duration_minutes?: number | null;
  status?: string | null;
};

type StudentSummaryCard = {
  id: string;
  name: string;
  lessonCount: number;
  unsentCount: number;
  latestLessonAt: string | null;
  nextReservationAt: string | null;
};

const extractStudentName = (student: StudentRow) => {
  const profile = Array.isArray(student.profile)
    ? student.profile[0]
    : student.profile;

  return profile?.display_name ?? "生徒";
};

const formatLessonLabel = (value: string | null) =>
  value ? formatJstDateTimeLabel(new Date(value)) : "まだレッスン記録はありません";

const formatReservationLabel = (value: string | null) =>
  value ? formatJstDateTimeLabel(new Date(value)) : "次の予定はまだありません";

const isActiveReservation = (status: string | null | undefined) =>
  !status?.startsWith("cancelled") && status !== "completed";

export default async function TeacherKartePage() {
  const user = await getTeacherWorkspaceUser();

  if (!user) {
    redirect("/");
  }

  const supabase = createServiceClient();
  const nowIso = new Date().toISOString();

  const [
    { data: students, error: studentsError },
    { data: lessons, error: lessonsError },
    { data: reservations, error: reservationsError },
  ] = await Promise.all([
    supabase
      .from("students")
      .select(
        `
          user_id,
          created_at,
          profile:profiles!user_id(display_name)
        `
      )
      .eq("teacher_id", user.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: true }),
    supabase
      .from("lessons")
      .select("id, student_id, recorded_at, sent_at, teacher_message")
      .eq("teacher_id", user.id)
      .order("recorded_at", { ascending: false }),
    supabase
      .from("reservations")
      .select("id, student_id, scheduled_at, duration_minutes, status")
      .eq("teacher_id", user.id)
      .gte("scheduled_at", nowIso)
      .order("scheduled_at", { ascending: true }),
  ]);

  if (studentsError) {
    throw new Error(studentsError.message);
  }

  if (lessonsError) {
    throw new Error(lessonsError.message);
  }

  if (reservationsError) {
    throw new Error(reservationsError.message);
  }

  const typedStudents = (students ?? []) as StudentRow[];
  const typedLessons = (lessons ?? []) as LessonRow[];
  const typedReservations = (reservations ?? []) as ReservationRow[];

  const lessonsByStudent = new Map<string, LessonRow[]>();
  const unsentCountByStudent = new Map<string, number>();

  for (const lesson of typedLessons) {
    const existingLessons = lessonsByStudent.get(lesson.student_id) ?? [];
    existingLessons.push(lesson);
    lessonsByStudent.set(lesson.student_id, existingLessons);

    if (!lesson.sent_at) {
      unsentCountByStudent.set(
        lesson.student_id,
        (unsentCountByStudent.get(lesson.student_id) ?? 0) + 1
      );
    }
  }

  const nextReservationByStudent = new Map<string, ReservationRow>();

  for (const reservation of typedReservations) {
    if (!isActiveReservation(reservation.status)) {
      continue;
    }

    if (!nextReservationByStudent.has(reservation.student_id)) {
      nextReservationByStudent.set(reservation.student_id, reservation);
    }
  }

  const studentCards = typedStudents
    .map((student): StudentSummaryCard => {
      const studentLessons = lessonsByStudent.get(student.user_id) ?? [];
      const latestLesson = studentLessons[0] ?? null;
      const nextReservation = nextReservationByStudent.get(student.user_id) ?? null;

      return {
        id: student.user_id,
        name: extractStudentName(student),
        lessonCount: studentLessons.length,
        unsentCount: unsentCountByStudent.get(student.user_id) ?? 0,
        latestLessonAt: latestLesson?.recorded_at ?? null,
        nextReservationAt: nextReservation?.scheduled_at ?? null,
      };
    })
    .sort((a, b) => {
      const aReference = a.nextReservationAt ?? a.latestLessonAt ?? "";
      const bReference = b.nextReservationAt ?? b.latestLessonAt ?? "";
      return bReference.localeCompare(aReference);
    });

  return (
    <div className="min-h-screen bg-[#f7faf8] px-5 py-6 md:mx-auto md:max-w-5xl md:px-6 md:py-8">
      <div className="mb-5 md:mb-8">
        <p className="text-[11px] font-semibold tracking-[0.22em] text-[#1D9E75]">
          KARTE
        </p>
        <h1 className="mt-2 text-[2rem] font-semibold tracking-tight text-slate-900 md:text-3xl">
          カルテ
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          生徒ごとのレッスン履歴と、次にやることをひと目で確認できます。
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-2 md:grid-cols-4">
        <SummaryMetric
          icon={Users}
          label="担当生徒"
          value={`${studentCards.length}`}
          unit="人"
        />
        <SummaryMetric
          icon={BookOpenText}
          label="レッスン履歴"
          value={`${typedLessons.length}`}
          unit="件"
        />
        <SummaryMetric
          icon={FileText}
          label="送信待ち"
          value={`${typedLessons.filter((lesson) => !lesson.sent_at).length}`}
          unit="件"
        />
        <SummaryMetric
          icon={Clock3}
          label="今後の予定"
          value={`${Array.from(nextReservationByStudent.values()).length}`}
          unit="件"
        />
      </div>

      {studentCards.length ? (
        <div className="space-y-3">
          {studentCards.map((student) => (
            <Link
              key={student.id}
              href={`/karte/${student.id}`}
              className="block rounded-[24px] border border-slate-200 bg-white px-4 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.04)] transition hover:border-[#9FE1CB] hover:bg-[#fbfefd]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#E1F5EE] text-base font-semibold text-[#1D9E75]">
                      {Array.from(student.name)[0] ?? "生"}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-slate-900">
                        {student.name}さん
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        レッスン {student.lessonCount}件 / 送信待ち {student.unsentCount}件
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-2 md:grid-cols-2">
                    <DetailPill
                      label="次の予定"
                      value={formatReservationLabel(student.nextReservationAt)}
                      tone={student.nextReservationAt ? "mint" : "neutral"}
                    />
                    <DetailPill
                      label="最新の記録"
                      value={formatLessonLabel(student.latestLessonAt)}
                      tone={student.latestLessonAt ? "neutral" : "neutral"}
                    />
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  {student.unsentCount > 0 ? (
                    <span className="rounded-full bg-[#fff1e7] px-2.5 py-1 text-[10px] font-semibold text-[#dd6b20]">
                      送信待ち {student.unsentCount}
                    </span>
                  ) : null}
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 text-slate-400">
                    <ChevronRight className="h-4 w-4" />
                  </span>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <span
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "pointer-events-none border-[#d9eee6] bg-[#f7fbf8] text-[#0F6E56]"
                  )}
                >
                  個別カルテを開く
                </span>
                <span
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "pointer-events-none text-slate-500"
                  )}
                >
                  <Mic className="mr-1 h-4 w-4" />
                  録音に進む
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="rounded-[24px] border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
          <CardContent className="space-y-4 py-8 text-sm leading-6 text-slate-500">
            <p>担当生徒がまだいません。生徒が紐付くとカルテ一覧がここに表示されます。</p>
            <Link href="/record/select-student" className={buttonVariants({ variant: "outline" })}>
              生徒を選んで録音する
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SummaryMetric({
  icon: Icon,
  label,
  value,
  unit,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <Card className="rounded-[22px] border border-slate-200 bg-white shadow-[0_8px_20px_rgba(15,23,42,0.03)]">
      <CardContent className="flex items-center gap-3 p-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E1F5EE] text-[#1D9E75]">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <p className="text-[11px] font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">
            {value}
            <span className="ml-0.5 text-[11px] font-normal text-slate-400">
              {unit}
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function DetailPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "mint" | "neutral";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-3 py-2.5",
        tone === "mint"
          ? "border-[#bde8d6] bg-[#f4fbf8]"
          : "border-slate-200 bg-slate-50"
      )}
    >
      <p className="text-[10px] font-semibold tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-xs leading-5 text-slate-600">{value}</p>
    </div>
  );
}
