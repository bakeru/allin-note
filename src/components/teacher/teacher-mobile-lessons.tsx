import Link from "next/link";
import {
  CheckCircle2,
  ChevronRight,
  Clock3,
  FilePenLine,
  MapPin,
  Mic,
  Send,
} from "lucide-react";

import { CancelReservationButton } from "@/components/reservations/cancel-reservation-button";
import { ReservationStatusBadge } from "@/components/reservations/reservation-status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type TeacherLessonReservation = {
  id: string;
  scheduledAt: string;
  durationMinutes: number;
  status: string;
  notes: string | null;
  locationName: string;
  studentName: string;
};

export type TeacherLessonNote = {
  id: string;
  recordedAt: string;
  sentAt?: string | null;
  teacherMessage?: string | null;
  studentName: string;
};

type TeacherMobileLessonsProps = {
  upcomingReservations: TeacherLessonReservation[];
  pastReservations: TeacherLessonReservation[];
  unsentLessons: TeacherLessonNote[];
  sentLessons: TeacherLessonNote[];
};

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const formatRecordedAt = (value: string) =>
  new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const formatSentAt = (value: string) =>
  new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

export function TeacherMobileLessons({
  upcomingReservations,
  pastReservations,
  unsentLessons,
  sentLessons,
}: TeacherMobileLessonsProps) {
  return (
    <div className="min-h-screen bg-[#f7faf8] px-5 pt-6 pb-10 md:hidden">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.22em] text-[#1D9E75]">
            LESSONS
          </p>
          <h1 className="mt-2 text-[2rem] font-semibold tracking-tight text-slate-900">
            レッスン
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            今日の予定、未送信ノート、最近の履歴をひとつにまとめました。
          </p>
        </div>
        <Link
          href="/reservations/new"
          className="rounded-2xl bg-[#1D9E75] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(29,158,117,0.18)]"
        >
          + 追加
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-[0_8px_20px_rgba(15,23,42,0.03)]">
          <div className="text-[10px] text-slate-600">今後の予約</div>
          <div className="mt-1 text-2xl font-medium text-slate-900">
            {upcomingReservations.length}
            <span className="ml-0.5 text-[11px] font-normal text-slate-400">
              件
            </span>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-[0_8px_20px_rgba(15,23,42,0.03)]">
          <div className="text-[10px] text-slate-600">送信待ち</div>
          <div className="mt-1 text-2xl font-medium text-slate-900">
            {unsentLessons.length}
            <span className="ml-0.5 text-[11px] font-normal text-slate-400">
              件
            </span>
          </div>
        </div>
      </div>

      <SectionHeader
        title="未送信のノート"
        meta={`${unsentLessons.length}件`}
      />
      {unsentLessons.length ? (
        <div className="mb-6 space-y-3">
          {unsentLessons.map((lesson) => (
            <LessonNoteCard key={lesson.id} lesson={lesson} tone="unsent" />
          ))}
        </div>
      ) : (
        <EmptyCard className="mb-6">
          今日の振り返りはすべて送信済みです。
        </EmptyCard>
      )}

      <SectionHeader
        title="今後のレッスン"
        meta={`${upcomingReservations.length}件`}
      />
      {upcomingReservations.length ? (
        <div className="mb-6 space-y-3">
          {upcomingReservations.map((reservation) => (
            <MobileReservationCard
              key={reservation.id}
              reservation={reservation}
              tone="upcoming"
            />
          ))}
        </div>
      ) : (
        <EmptyCard className="mb-6">
          まだ今後の予約はありません。必要ならここから追加できます。
        </EmptyCard>
      )}

      <SectionHeader title="最近送信したノート" meta={`${sentLessons.length}件`} />
      {sentLessons.length ? (
        <div className="mb-6 space-y-3">
          {sentLessons.map((lesson) => (
            <LessonNoteCard key={lesson.id} lesson={lesson} tone="sent" />
          ))}
        </div>
      ) : (
        <EmptyCard className="mb-6">
          送信済みのノートはまだありません。
        </EmptyCard>
      )}

      <SectionHeader title="過去の予約" meta={`${pastReservations.length}件`} />
      {pastReservations.length ? (
        <div className="space-y-3">
          {pastReservations.map((reservation) => (
            <MobileReservationCard
              key={reservation.id}
              reservation={reservation}
              tone="past"
            />
          ))}
        </div>
      ) : (
        <EmptyCard>過去の予約はまだありません。</EmptyCard>
      )}
    </div>
  );
}

function SectionHeader({ title, meta }: { title: string; meta: string }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      <span className="text-[11px] font-medium text-slate-400">{meta}</span>
    </div>
  );
}

function EmptyCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "rounded-[24px] border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.04)]",
        className
      )}
    >
      <CardContent className="py-5 text-sm leading-6 text-slate-500">
        {children}
      </CardContent>
    </Card>
  );
}

function LessonNoteCard({
  lesson,
  tone,
}: {
  lesson: TeacherLessonNote;
  tone: "unsent" | "sent";
}) {
  const isUnsent = tone === "unsent";

  return (
    <Link
      href={`/lessons/${lesson.id}/edit`}
      className={cn(
        "block rounded-[24px] border p-4 shadow-[0_12px_30px_rgba(15,23,42,0.04)] transition",
        isUnsent
          ? "border-[#f8d7b8] bg-[#fff8f1]"
          : "border-slate-200 bg-white"
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">
            {lesson.studentName}さん
          </p>
          <p className="mt-1 text-xs text-slate-500">
            録音: {formatRecordedAt(lesson.recordedAt)}
          </p>
          {lesson.sentAt ? (
            <p className="mt-1 text-xs text-slate-500">
              送信: {formatSentAt(lesson.sentAt)}
            </p>
          ) : null}
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

      <div className="flex items-center justify-between gap-3">
        <p className="line-clamp-2 text-xs leading-5 text-slate-500">
          {lesson.teacherMessage?.trim()
            ? lesson.teacherMessage
            : "要約を確認して、生徒へのひとことを整えられます。"}
        </p>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-400">
          <ChevronRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}

function MobileReservationCard({
  reservation,
  tone,
}: {
  reservation: TeacherLessonReservation;
  tone: "upcoming" | "past";
}) {
  const isUpcoming = tone === "upcoming";
  const isScheduled = reservation.status === "scheduled";

  return (
    <Card
      className={cn(
        "rounded-[24px] border shadow-[0_12px_30px_rgba(15,23,42,0.04)]",
        isUpcoming ? "border-[#d9eee6] bg-white" : "border-slate-200 bg-white"
      )}
    >
      <CardContent className="p-4">
        <div className="mb-2 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {reservation.studentName}さん
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {formatDateTime(reservation.scheduledAt)}
            </p>
          </div>
          <ReservationStatusBadge status={reservation.status} />
        </div>

        <div className="flex flex-wrap gap-2.5 text-[11px] text-slate-600">
          <span className="inline-flex items-center gap-1">
            <Clock3 className="h-3 w-3" />
            {reservation.durationMinutes}分
          </span>
          {reservation.locationName ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {reservation.locationName}
            </span>
          ) : null}
        </div>

        {reservation.notes ? (
          <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-500">
            メモ: {reservation.notes}
          </p>
        ) : null}

        {isUpcoming ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/record/start/${reservation.id}`}
              className={cn(
                buttonVariants({ size: "sm" }),
                "rounded-xl bg-[#1D9E75] text-white hover:bg-[#0F6E56]"
              )}
            >
              <Mic className="mr-1 h-4 w-4" />
              録音
            </Link>
            {isScheduled ? (
              <>
                <Link
                  href={`/reservations/${reservation.id}/edit`}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "rounded-xl border-[#cfe6dd] bg-[#f8fcfa] text-slate-700"
                  )}
                >
                  <FilePenLine className="mr-1 h-4 w-4" />
                  編集
                </Link>
                <CancelReservationButton
                  reservationId={reservation.id}
                  scheduledAt={reservation.scheduledAt}
                  deadlineHours={24}
                  lateCancellationPolicy="consume"
                  triggerLabel="キャンセル"
                  variant="ghost"
                />
              </>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
