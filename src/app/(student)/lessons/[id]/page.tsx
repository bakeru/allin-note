import Link from "next/link";
import { notFound } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getSignedAudioUrl } from "@/lib/storage/r2";
import { createServiceClient } from "@/lib/supabase/service";
import { cn } from "@/lib/utils";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type StudentSummary = {
  learned?: string[];
  achievements?: string[];
  homework?: string[];
  next_lesson_note?: string;
};

type LessonStatus =
  | "recording"
  | "uploading"
  | "transcribing"
  | "summarizing"
  | "ready"
  | "sent";

type SummaryValue = StudentSummary | string | null | undefined;

const formatRecordedAt = (value: string) =>
  new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

function SummarySection({
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
      <ul className="list-disc space-y-1 pl-5 text-base leading-7 text-slate-700">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

const getSummaryStatusMessage = (status: LessonStatus) => {
  if (status === "recording") return "録音中です";
  if (status === "uploading") return "アップロード中です";
  if (status === "transcribing") return "文字起こし中です";
  if (status === "summarizing") return "AIが要約を生成中です...";
  return "要約がまだ準備されていません";
};

const parseStudentSummary = (summary: SummaryValue): StudentSummary | null => {
  if (!summary) {
    return null;
  }

  if (typeof summary === "string") {
    try {
      const parsed = JSON.parse(summary) as StudentSummary;
      return parsed;
    } catch {
      return null;
    }
  }

  return summary;
};

const hasStudentSummaryContent = (summary: StudentSummary | null) =>
  !!(
    summary?.learned?.length ||
    summary?.achievements?.length ||
    summary?.homework?.length ||
    summary?.next_lesson_note?.trim()
  );

function StudentSummaryContent({
  status,
  summary,
}: {
  status: LessonStatus;
  summary: SummaryValue;
}) {
  const parsedSummary = parseStudentSummary(summary);

  if (!parsedSummary) {
    return <EmptyState message={getSummaryStatusMessage(status)} />;
  }

  if (!hasStudentSummaryContent(parsedSummary)) {
    return <EmptyState message="要約内容がありません" />;
  }

  return (
    <div className="space-y-6">
      <SummarySection title="今日学んだこと" items={parsedSummary.learned} />
      <SummarySection
        title="よくできた点"
        items={parsedSummary.achievements}
      />
      <SummarySection title="次回までの宿題" items={parsedSummary.homework} />

      {parsedSummary.next_lesson_note?.trim() ? (
        <section className="space-y-2">
          <h3 className="text-base font-semibold text-slate-950">次回予定</h3>
          <p className="text-base leading-7 text-slate-700">
            {parsedSummary.next_lesson_note}
          </p>
        </section>
      ) : null}
    </div>
  );
}

export default async function StudentLessonDetailPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user || user.role !== "student") {
    notFound();
  }

  const supabase = createServiceClient();
  const { data: lesson } = await supabase
    .from("lessons")
    .select(
      "id, recorded_at, duration_seconds, status, summary_for_student, audio_path, audio_deleted"
    )
    .eq("id", id)
    .eq("student_id", user.id)
    .not("sent_at", "is", null)
    .eq("hidden_by_student", false)
    .single();

  if (!lesson) {
    notFound();
  }

  let audioUrl: string | null = null;

  if (lesson.audio_path && !lesson.audio_deleted) {
    try {
      audioUrl = await getSignedAudioUrl(lesson.audio_path);
    } catch {
      audioUrl = null;
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-4xl flex-col px-5 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/dashboard"
          className={buttonVariants({
            variant: "outline",
            className:
              "border-sky-200 bg-white text-slate-700 hover:bg-sky-50",
          })}
        >
          ダッシュボードへ戻る
        </Link>
        <p className="text-sm text-slate-600">
          {formatRecordedAt(lesson.recorded_at)}
        </p>
      </div>

      <Card className="border border-sky-100 bg-white/95 ring-0">
        <CardHeader>
          <CardTitle className="text-2xl text-slate-950">
            生徒向けレッスンノート
          </CardTitle>
          <CardDescription className="text-base leading-7 text-slate-600">
            AIが整理したレッスン内容です。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <StudentSummaryContent
            status={lesson.status as LessonStatus}
            summary={lesson.summary_for_student as SummaryValue}
          />
        </CardContent>
      </Card>

      <Card className="mt-6 border border-slate-200 bg-white ring-0">
        <CardHeader>
          <CardTitle className="text-xl text-slate-950">音声再生</CardTitle>
          <CardDescription className="text-base leading-7 text-slate-600">
            録音されたレッスン音声を確認できます。
          </CardDescription>
        </CardHeader>
        <CardContent>
          {audioUrl ? (
            <audio className="w-full" controls src={audioUrl}>
              <track kind="captions" />
            </audio>
          ) : (
            <p
              className={cn(
                "text-base leading-7 text-slate-600"
              )}
            >
              音声ファイルは利用できません。
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
