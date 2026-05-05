import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import {
  saveTeacherMessageAction,
  type StudentSummary,
  updateStudentSummaryAction,
} from "@/actions/lessons";
import { SummaryEditor } from "@/components/lessons/summary-editor";
import { EmptyState } from "@/components/shared/empty-state";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { createServiceClient } from "@/lib/supabase/service";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type TeacherSummary = {
  lesson_flow?: string;
  teaching_highlights?: string[];
  observations?: string[];
  questions_for_reflection?: string[];
};

type LessonRow = {
  id: string;
  recorded_at: string;
  sent_at?: string | null;
  teacher_message?: string | null;
  summary_for_student?: StudentSummary | string | null;
  summary_for_student_original?: StudentSummary | string | null;
  summary_for_teacher?: TeacherSummary | string | null;
  summary_edited_at?: string | null;
  summary_edited_count?: number | null;
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

const formatRecordedAt = (value: string) =>
  new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
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

const extractStudentName = (lesson: LessonRow) => {
  const student = Array.isArray(lesson.student) ? lesson.student[0] : lesson.student;
  const profile = Array.isArray(student?.profile)
    ? student.profile[0]
    : student?.profile;

  return profile?.display_name ?? "生徒";
};

const parseJsonSummary = <T,>(summary: T | string | null | undefined): T | null => {
  if (!summary) {
    return null;
  }

  if (typeof summary === "string") {
    try {
      return JSON.parse(summary) as T;
    } catch {
      return null;
    }
  }

  return summary;
};

function TeacherSummaryList({
  title,
  items,
}: {
  title: string;
  items?: string[];
}) {
  if (!items?.length) return null;

  return (
    <section className="space-y-2">
      <h3 className="text-base font-semibold text-slate-950">{title}</h3>
      <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-slate-700">
        {items.map((item, index) => (
          <li key={`${title}-${index}`}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export default async function TeacherLessonEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user || user.role !== "teacher") {
    redirect("/");
  }

  const supabase = createServiceClient();
  const { data: lesson, error } = await supabase
    .from("lessons")
    .select(
      `
        *,
        student:students!inner(
          profile:profiles!user_id(display_name)
        )
      `
    )
    .eq("id", id)
    .eq("teacher_id", user.id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (!lesson) {
    notFound();
  }

  const typedLesson = lesson as LessonRow;
  const studentName = extractStudentName(typedLesson);
  const studentSummary = parseJsonSummary<StudentSummary>(
    typedLesson.summary_for_student
  );
  const originalStudentSummary = parseJsonSummary<StudentSummary>(
    typedLesson.summary_for_student_original
  );
  const teacherSummary = parseJsonSummary<TeacherSummary>(
    typedLesson.summary_for_teacher
  );

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl flex-col gap-8 bg-[#f7fbf8] px-5 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Link
            href="/dashboard"
            className={buttonVariants({
              variant: "ghost",
              size: "sm",
              className:
                "rounded-full px-4 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700",
            })}
          >
            ダッシュボードへ戻る
          </Link>
          <p className="text-xs font-bold tracking-[0.28em] text-emerald-500">
            REVIEW BEFORE SEND
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-slate-950">
            {studentName}さんのレッスン
          </h1>
          <p className="text-base text-slate-500">
            録音日時: {formatRecordedAt(typedLesson.recorded_at)}
          </p>
        </div>

        <div
          className={cn(
            "rounded-full px-4 py-2 text-sm font-semibold",
            typedLesson.sent_at
              ? "bg-slate-100 text-slate-700"
              : "bg-emerald-100 text-emerald-700"
          )}
        >
          {typedLesson.sent_at
            ? `送信済み (${formatSentAt(typedLesson.sent_at)})`
            : "まだ送信されていません"}
        </div>
      </div>

      <section className="rounded-[28px] border border-emerald-100 bg-white px-5 py-5 shadow-[0_18px_40px_rgba(15,31,46,0.08)]">
        <div className="flex flex-wrap items-center gap-3">
          {[
            { label: "録音", done: true },
            { label: "要約", done: true },
            { label: "編集", active: true },
            { label: "送信" },
          ].map((step, index) => (
            <div key={step.label} className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border text-sm font-bold",
                    step.done
                      ? "border-emerald-300 bg-emerald-300 text-slate-950"
                      : step.active
                        ? "border-slate-950 bg-slate-950 text-emerald-300"
                        : "border-slate-200 bg-white text-slate-400"
                  )}
                >
                  {step.done ? "✓" : index + 1}
                </span>
                <span className="text-sm font-semibold text-slate-600">
                  {step.label}
                </span>
              </div>
              {index < 3 ? <span className="h-px w-8 bg-slate-200" /> : null}
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-[28px] border-0 bg-white shadow-[0_18px_40px_rgba(15,31,46,0.08)] ring-1 ring-emerald-100">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-3xl text-slate-950">
                  生徒向け要約
                </CardTitle>
                <CardDescription className="mt-2 text-base leading-7">
                  生徒・保護者に届く内容をここで確認できます。
                </CardDescription>
              </div>
              <span className="rounded-lg bg-slate-950 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-300">
                AI Summary
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <SummaryEditor
              lessonId={typedLesson.id}
              initialSummary={studentSummary}
              originalSummary={originalStudentSummary ?? studentSummary}
              editedCount={typedLesson.summary_edited_count ?? 0}
              editedAt={typedLesson.summary_edited_at ?? null}
              canEdit={!typedLesson.sent_at}
              onSubmit={updateStudentSummaryAction}
            />
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-0 bg-white shadow-[0_18px_40px_rgba(15,31,46,0.08)] ring-1 ring-slate-200">
          <CardHeader>
            <CardTitle className="text-3xl text-slate-950">
              講師向けフィードバック
            </CardTitle>
            <CardDescription className="mt-2 text-base leading-7">
              折りたたんで振り返りメモを確認できます。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <details className="rounded-[20px] border border-slate-200 bg-slate-50 px-5 py-4">
              <summary className="cursor-pointer list-none text-sm font-semibold text-slate-700">
                振り返り内容を開く
              </summary>
              <div className="mt-4 space-y-5">
                {teacherSummary ? (
                  <>
                    {teacherSummary.lesson_flow?.trim() ? (
                      <section className="space-y-2">
                        <h3 className="text-base font-semibold text-slate-950">
                          レッスンの流れ
                        </h3>
                        <p className="text-sm leading-6 text-slate-700">
                          {teacherSummary.lesson_flow}
                        </p>
                      </section>
                    ) : null}
                    <TeacherSummaryList
                      title="印象的な場面"
                      items={teacherSummary.teaching_highlights}
                    />
                    <TeacherSummaryList
                      title="観察された事実"
                      items={teacherSummary.observations}
                    />
                    <TeacherSummaryList
                      title="振り返りのための問い"
                      items={teacherSummary.questions_for_reflection}
                    />
                  </>
                ) : (
                  <EmptyState message="講師向けフィードバックはまだありません" />
                )}
              </div>
            </details>
          </CardContent>
        </Card>
      </section>

      <Card className="rounded-[28px] border-0 bg-white shadow-[0_18px_40px_rgba(15,31,46,0.08)] ring-1 ring-emerald-100">
        <CardHeader>
          <CardTitle className="text-3xl text-slate-950">
            先生からのメッセージ
          </CardTitle>
          <CardDescription className="mt-2 text-base leading-7">
            生徒・保護者に届ける温かい一言を入力してください。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={saveTeacherMessageAction} className="space-y-5">
            <input type="hidden" name="lesson_id" value={typedLesson.id} />
            <textarea
              name="teacher_message"
              defaultValue={typedLesson.teacher_message ?? ""}
              rows={7}
              className="w-full rounded-[20px] border border-slate-200 bg-[#fbfefc] px-4 py-4 text-base leading-8 text-slate-900 outline-none transition focus:border-emerald-300"
              placeholder="今日はよく集中して取り組めていました。次回も楽しみにしています。"
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                type="submit"
                name="intent"
                value="save"
                variant="outline"
                className="rounded-2xl px-6"
              >
                一旦保存
              </Button>
              <Button
                type="submit"
                name="intent"
                value="send"
                className="rounded-2xl bg-slate-950 px-6 text-white hover:bg-slate-800"
              >
                保存して送信
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
