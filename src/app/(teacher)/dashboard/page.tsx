import Link from "next/link";
import { redirect } from "next/navigation";

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

const extractStudentName = (lesson: LessonRow) => {
  const student = Array.isArray(lesson.student) ? lesson.student[0] : lesson.student;
  const profile = Array.isArray(student?.profile)
    ? student.profile[0]
    : student?.profile;

  return profile?.display_name ?? "生徒";
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
  const user = await getCurrentUser();

  if (!user || user.role !== "teacher") {
    redirect("/");
  }

  const supabase = createServiceClient();
  const [{ data: unsent, error: unsentError }, { data: sent, error: sentError }] =
    await Promise.all([
      supabase
        .from("lessons")
        .select(
          `
            *,
            student:students!inner(
              profile:profiles!students_user_id_fkey(display_name)
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
              profile:profiles!students_user_id_fkey(display_name)
            )
          `
        )
        .eq("teacher_id", user.id)
        .eq("status", "ready")
        .not("sent_at", "is", null)
        .order("sent_at", { ascending: false })
        .limit(10),
    ]);

  if (unsentError) {
    throw new Error(unsentError.message);
  }

  if (sentError) {
    throw new Error(sentError.message);
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl flex-col gap-8 px-5 py-8">
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
  );
}
