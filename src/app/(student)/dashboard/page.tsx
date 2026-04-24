import Link from "next/link";

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

export default async function StudentDashboardPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "student") {
    return null;
  }

  const supabase = createServiceClient();
  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, recorded_at, duration_seconds")
    .eq("student_id", user.id)
    .eq("status", "ready")
    .not("sent_at", "is", null)
    .eq("hidden_by_student", false)
    .order("recorded_at", { ascending: false });

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
                    className:
                      "bg-sky-600 text-white hover:bg-sky-700",
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
