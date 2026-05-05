import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Ellipsis, Play } from "lucide-react";

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
      <h3 className="flex items-center gap-3 text-sm font-bold uppercase tracking-[0.14em] text-emerald-600">
        <span className="h-0.5 w-4 rounded bg-emerald-400" />
        {title}
      </h3>
      <ul className="space-y-3 pl-1 text-base leading-8 text-slate-700">
        {items.map((item) => (
          <li key={item} className="flex gap-3">
            <span className="mt-3 h-2 w-2 shrink-0 rounded-full bg-emerald-300" />
            <span>{item}</span>
          </li>
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
      <SummarySection title="今日のポイント" items={parsedSummary.learned} />
      <SummarySection title="よくできた点" items={parsedSummary.achievements} />
      <SummarySection title="次回までの宿題" items={parsedSummary.homework} />

      {parsedSummary.next_lesson_note?.trim() ? (
        <section className="space-y-2">
          <h3 className="flex items-center gap-3 text-sm font-bold uppercase tracking-[0.14em] text-emerald-600">
            <span className="h-0.5 w-4 rounded bg-emerald-400" />
            次回予定
          </h3>
          <p className="text-base leading-8 text-slate-700">
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
    .select("*, audio_path, audio_deleted")
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
    <div className="mx-auto min-h-[calc(100vh-3.5rem)] w-full max-w-md px-4 pb-14 pt-4 sm:max-w-4xl sm:px-5 sm:pt-8">
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/student/dashboard"
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-[0_10px_20px_rgba(15,31,46,0.05)]"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <p className="text-base font-bold text-slate-950">連絡帳</p>
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-[0_10px_20px_rgba(15,31,46,0.05)]"
        >
          <Ellipsis className="h-5 w-5" />
        </button>
      </div>

      <section className="overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-[0_16px_40px_rgba(15,31,46,0.08)]">
        <div className="bg-[linear-gradient(135deg,#e9faf1_0%,#f8fdf9_100%)] px-6 py-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-bold tracking-[0.16em] text-emerald-500">
              {formatRecordedAt(lesson.recorded_at)}
            </p>
            <span className="rounded-full border border-emerald-100 bg-white px-4 py-2 text-sm font-bold text-emerald-600">
              レッスンノート
            </span>
          </div>
          <h1 className="text-[2.05rem] font-extrabold leading-tight tracking-tight text-slate-950">
            バッハの装飾音、見違えるように整いましたね
          </h1>
        </div>

        <div className="flex items-center gap-4 px-6 py-5">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-200 to-orange-300 text-base font-bold text-white">
            田
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
              FROM TEACHER
            </p>
            <p className="text-xl font-bold tracking-tight text-slate-950">
              田中 美咲 先生
            </p>
          </div>
        </div>
      </section>

      <section className="mt-5 rounded-[24px] bg-[linear-gradient(135deg,#102232_0%,#1f364b_100%)] px-5 py-5 text-white shadow-[0_18px_45px_rgba(15,31,46,0.22)]">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-300 text-slate-950 shadow-[0_14px_34px_rgba(125,224,176,0.28)]">
            <Play className="ml-1 h-7 w-7 fill-current" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">
              LESSON RECORDING
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight">レッスン録音</p>
          </div>
          <p className="text-xl font-semibold text-white/65">48:23</p>
        </div>
        <div className="mt-5 flex h-10 items-end gap-1.5">
          {[
            12, 20, 16, 24, 18, 14, 26, 30, 20, 16, 22, 28, 18, 13, 20, 26,
            16, 12, 22, 28,
          ].map((height, index) => (
            <span
              key={`${height}-${index}`}
              className={cn(
                "block flex-1 rounded-sm",
                index < 8 ? "bg-emerald-300" : "bg-emerald-300/38"
              )}
              style={{ height }}
            />
          ))}
        </div>
      </section>

      <section className="mt-5 rounded-[28px] border border-slate-100 bg-white px-6 py-6 shadow-[0_16px_40px_rgba(15,31,46,0.08)]">
        <div className="space-y-6">
          <StudentSummaryContent
            status={lesson.status as LessonStatus}
            summary={lesson.summary_for_student as SummaryValue}
          />
        </div>
      </section>

      {lesson.teacher_message?.trim() ? (
        <section className="mt-5 rounded-[28px] border border-emerald-200 bg-[linear-gradient(135deg,#f5fcf8_0%,#ffffff_100%)] px-6 py-6 shadow-[0_16px_40px_rgba(15,31,46,0.06)]">
          <h3 className="mb-4 flex items-center gap-3 text-sm font-bold uppercase tracking-[0.14em] text-emerald-600">
            <span className="h-0.5 w-4 rounded bg-emerald-400" />
            先生からのひとこと
          </h3>
          <p className="whitespace-pre-wrap text-lg leading-9 text-slate-700">
            {lesson.teacher_message}
          </p>
          <div className="mt-5 flex items-center gap-3 border-t border-emerald-100 pt-4 text-sm text-slate-500">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-orange-200 to-orange-300 font-bold text-white">
              田
            </span>
            <span>
              先生からのひとこと ·{" "}
              <strong className="font-semibold text-slate-900">
                田中 美咲
              </strong>
            </span>
          </div>
        </section>
      ) : null}

      <section className="mt-5 rounded-[24px] border border-slate-100 bg-white px-6 py-6 shadow-[0_16px_40px_rgba(15,31,46,0.06)]">
        <h2 className="mb-3 text-lg font-bold tracking-tight text-slate-950">
          音声を再生する
        </h2>
        <p className="mb-4 text-sm leading-7 text-slate-500">
          録音されたレッスン音声を確認できます。
        </p>
        <div>
          {audioUrl ? (
            <audio className="w-full" controls src={audioUrl}>
              <track kind="captions" />
            </audio>
          ) : (
            <p className="text-base leading-7 text-slate-600">
              音声ファイルは利用できません。
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
