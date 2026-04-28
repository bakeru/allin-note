import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import {
  saveTeacherMessageAction,
  type StudentSummary,
  updateStudentSummaryAction,
} from "@/actions/lessons";
import { Button, buttonVariants } from "@/components/ui/button";
import { SummaryEditor } from "@/components/lessons/summary-editor";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
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
      <h3 className="text-base font-semibold text-neutral-950">{title}</h3>
      <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-neutral-700">
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
          profile:profiles!students_user_id_fkey(display_name)
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
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl flex-col gap-8 px-5 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Link
            href="/dashboard"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            ダッシュボードへ戻る
          </Link>
          <h1 className="text-3xl font-semibold text-neutral-950">
            {studentName}さんのレッスン
          </h1>
          <p className="text-sm text-neutral-600">
            録音日時: {formatRecordedAt(typedLesson.recorded_at)}
          </p>
        </div>

        <div
          className={cn(
            "rounded-full px-4 py-2 text-sm font-medium",
            typedLesson.sent_at
              ? "bg-neutral-100 text-neutral-700"
              : "bg-amber-100 text-amber-800"
          )}
        >
          {typedLesson.sent_at
            ? `送信済み (${formatSentAt(typedLesson.sent_at)})`
            : "まだ送信されていません"}
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-lg border-0 bg-white ring-1 ring-neutral-200">
          <CardHeader>
            <CardTitle className="text-2xl text-neutral-950">
              生徒向け要約
            </CardTitle>
            <CardDescription>
              生徒・保護者に届く内容をここで確認できます。
            </CardDescription>
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

        <Card className="rounded-lg border-0 bg-white ring-1 ring-neutral-200">
          <CardHeader>
            <CardTitle className="text-2xl text-neutral-950">
              講師向けフィードバック
            </CardTitle>
            <CardDescription>
              折りたたんで振り返りメモを確認できます。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <details className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3">
              <summary className="cursor-pointer list-none text-sm font-medium text-neutral-700">
                振り返り内容を開く
              </summary>
              <div className="mt-4 space-y-5">
                {teacherSummary ? (
                  <>
                    {teacherSummary.lesson_flow?.trim() ? (
                      <section className="space-y-2">
                        <h3 className="text-base font-semibold text-neutral-950">
                          レッスンの流れ
                        </h3>
                        <p className="text-sm leading-6 text-neutral-700">
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

      <Card className="rounded-lg border-0 bg-white ring-1 ring-neutral-200">
        <CardHeader>
          <CardTitle className="text-2xl text-neutral-950">
            先生からのメッセージ
          </CardTitle>
          <CardDescription>
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
              className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-3 text-sm leading-6 text-neutral-900 outline-none transition focus:border-neutral-400"
              placeholder="今日はよく集中して取り組めていました。次回も楽しみにしています。"
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button type="submit" name="intent" value="save" variant="outline">
                一旦保存
              </Button>
              <Button type="submit" name="intent" value="send">
                保存して送信
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
