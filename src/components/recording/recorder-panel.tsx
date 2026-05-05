"use client";

import { Loader2, Mic, Pause, Play, RotateCcw, Square } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import {
  type RecordingResult,
  type RecorderState,
  useRecorder,
} from "@/hooks/use-recorder";
import {
  type StudentSummary,
  type TeacherSummary,
} from "@/lib/ai/summarizer";
import { cn } from "@/lib/utils";

const DEV_STUDENT_ID = process.env.NEXT_PUBLIC_DEV_STUDENT_ID;

type ProcessingStage =
  | "idle"
  | "uploading"
  | "uploaded"
  | "transcribing"
  | "summarizing"
  | "ready"
  | "error";

type UploadResponse = {
  lesson_id?: string;
  error?: string;
};

type TranscriptionResponse = {
  success?: boolean;
  transcript?: string;
  error?: string;
};

type SummaryResponse = {
  success?: boolean;
  student_summary?: StudentSummary;
  teacher_summary?: TeacherSummary;
  error?: string;
};

const formatDuration = (duration: number) => {
  const minutes = Math.floor(duration / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(duration % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${seconds}`;
};

const getRecorderStatusText = (state: RecorderState, hasRecording: boolean) => {
  if (state === "recording") return "録音中";
  if (state === "paused") return "一時停止中";
  if (state === "stopping") return "録音を保存中";
  if (hasRecording) return "録音完了";
  return "待機中";
};

const getProcessingText = (stage: ProcessingStage) => {
  if (stage === "uploading") return "アップロード中...";
  if (stage === "uploaded") return "アップロード完了";
  if (stage === "transcribing") return "文字起こし中...";
  if (stage === "summarizing") return "要約生成中...";
  if (stage === "ready") return "要約生成完了";
  return "";
};

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
      <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
      <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-slate-700">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

const hasStudentSummaryContent = (summary: StudentSummary | null) =>
  !!(
    summary?.learned?.length ||
    summary?.achievements?.length ||
    summary?.homework?.length ||
    summary?.next_lesson_note?.trim()
  );

const hasTeacherSummaryContent = (summary: TeacherSummary | null) =>
  !!(
    summary?.lesson_flow?.trim() ||
    summary?.teaching_highlights?.length ||
    summary?.observations?.length ||
    summary?.questions_for_reflection?.length
  );

type RecorderPanelProps = {
  studentId?: string;
  studentName?: string;
  reservationId?: string | null;
};

export function RecorderPanel({
  studentId,
  studentName,
  reservationId,
}: RecorderPanelProps = {}) {
  const [recording, setRecording] = useState<RecordingResult | null>(null);
  const [stage, setStage] = useState<ProcessingStage>("idle");
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [studentSummary, setStudentSummary] = useState<StudentSummary | null>(
    null
  );
  const [teacherSummary, setTeacherSummary] = useState<TeacherSummary | null>(
    null
  );
  const { start, stop, pause, resume, state, duration, error } = useRecorder({
    onRecordingComplete: setRecording,
  });

  useEffect(() => {
    return () => {
      if (recording?.url) {
        URL.revokeObjectURL(recording.url);
      }
    };
  }, [recording]);

  const resetRecording = useCallback(() => {
    if (recording?.url) {
      URL.revokeObjectURL(recording.url);
    }

    setRecording(null);
    setStage("idle");
    setProcessingError(null);
    setLessonId(null);
    setTranscript(null);
    setStudentSummary(null);
    setTeacherSummary(null);
  }, [recording]);

  const uploadRecording = useCallback(
    async (nextRecording: RecordingResult) => {
      const activeStudentId = studentId ?? DEV_STUDENT_ID;

      if (!activeStudentId) {
        setStage("error");
        setProcessingError(
          ".env.localにNEXT_PUBLIC_DEV_STUDENT_IDを設定してください。"
        );
        return null;
      }

      setStage("uploading");
      setProcessingError(null);

      const formData = new FormData();
      formData.append(
        "audio",
        nextRecording.blob,
        `recording.${
          nextRecording.mimeType.includes("mp4") ? "m4a" : "webm"
        }`
      );
      formData.append("student_id", activeStudentId);
      formData.append(
        "duration_seconds",
        Math.round(nextRecording.duration).toString()
      );
      if (reservationId) {
        formData.append("reservation_id", reservationId);
      }

      const response = await fetch("/api/lessons/upload", {
        method: "POST",
        body: formData,
      });
      const body = (await response.json()) as UploadResponse;

      if (!response.ok || !body.lesson_id) {
        throw new Error(body.error ?? "アップロードに失敗しました。");
      }

      setLessonId(body.lesson_id);
      setStage("uploaded");
      return body.lesson_id;
    },
    [reservationId, studentId]
  );

  const transcribeLesson = useCallback(async (nextLessonId: string) => {
    setStage("transcribing");
    setProcessingError(null);

    const response = await fetch(`/api/lessons/${nextLessonId}/transcribe`, {
      method: "POST",
    });
    const body = (await response.json()) as TranscriptionResponse;

    if (!response.ok || !body.transcript) {
      throw new Error(body.error ?? "文字起こしに失敗しました。");
    }

    setTranscript(body.transcript);
    return body.transcript;
  }, []);

  const summarizeLesson = useCallback(async (nextLessonId: string) => {
    setStage("summarizing");
    setProcessingError(null);

    const response = await fetch(`/api/lessons/${nextLessonId}/summarize`, {
      method: "POST",
    });
    const body = (await response.json()) as SummaryResponse;

    if (!response.ok || !body.student_summary || !body.teacher_summary) {
      throw new Error(body.error ?? "要約生成に失敗しました。");
    }

    setStudentSummary(body.student_summary);
    setTeacherSummary(body.teacher_summary);
    setStage("ready");
  }, []);

  const runPipeline = useCallback(
    async (nextRecording: RecordingResult) => {
      try {
        const nextLessonId = lessonId ?? (await uploadRecording(nextRecording));
        if (!nextLessonId) return;

        await transcribeLesson(nextLessonId);
        await summarizeLesson(nextLessonId);
      } catch (unknownError) {
        setStage("error");
        setProcessingError(
          unknownError instanceof Error
            ? unknownError.message
            : "処理中にエラーが発生しました。"
        );
      }
    },
    [lessonId, summarizeLesson, transcribeLesson, uploadRecording]
  );

  const retryCurrentStep = useCallback(async () => {
    if (!recording) return;

    try {
      if (!lessonId) {
        await runPipeline(recording);
        return;
      }

      if (!transcript) {
        await transcribeLesson(lessonId);
        await summarizeLesson(lessonId);
        return;
      }

      if (!studentSummary || !teacherSummary) {
        await summarizeLesson(lessonId);
        return;
      }

      await summarizeLesson(lessonId);
    } catch (unknownError) {
      setStage("error");
      setProcessingError(
        unknownError instanceof Error
          ? unknownError.message
          : "リトライに失敗しました。"
      );
    }
  }, [
    lessonId,
    recording,
    runPipeline,
    studentSummary,
    summarizeLesson,
    teacherSummary,
    transcript,
    transcribeLesson,
  ]);

  const handleStart = async () => {
    resetRecording();
    await start();
  };

  const handleStop = async () => {
    await stop();
  };

  useEffect(() => {
    if (!recording || stage !== "idle") return;

    void runPipeline(recording);
  }, [recording, runPipeline, stage]);

  const isRecording = state === "recording";
  const isPaused = state === "paused";
  const isBusy = state === "stopping";
  const canReset = stage === "ready";
  const activeDuration = recording?.duration ?? duration;
  const processingText = getProcessingText(stage);
  const currentStudentLabel = studentName
    ? `${studentName}さんのレッスン`
    : "レッスン録音";

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-5 py-8">
      <section className="relative overflow-hidden rounded-[36px] bg-[linear-gradient(180deg,#0a1623_0%,#142231_100%)] px-6 py-7 text-white shadow-[0_30px_80px_rgba(0,0,0,0.28)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_55%,rgba(125,224,176,0.12)_0%,transparent_38%)]" />
        <div className="relative mb-6 text-center">
          <p className="text-xs font-bold tracking-[0.3em] text-emerald-300">
            RECORDING LESSON
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">
            {currentStudentLabel}
          </h2>
          <p className="mt-3 text-sm leading-7 text-white/55">
            停止後に自動でアップロード、文字起こし、要約生成まで進みます。
          </p>
        </div>

        <div className="relative mx-auto mb-8 flex max-w-2xl items-center gap-4 rounded-[24px] border border-white/8 bg-white/5 px-5 py-4 backdrop-blur-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-300 to-emerald-500 text-2xl font-bold text-slate-950 shadow-[0_14px_34px_rgba(125,224,176,0.28)]">
            {(studentName ?? "生").slice(0, 1)}
          </div>
          <div className="flex-1">
            <p className="text-2xl font-bold tracking-tight text-white">
              {studentName
                ? `${studentName}さん`
                : "録音の準備ができています"}
            </p>
            <p className="mt-1 text-sm text-white/52">
              {reservationId
                ? "予約とひもづいた録音です"
                : "録音後にノート下書きを整えます"}
            </p>
          </div>
        </div>

        <div className="relative flex flex-col items-center">
          <p className="font-mono text-7xl font-extralight tracking-[0.05em] text-white">
            {formatDuration(activeDuration)}
          </p>
          <p className="mt-3 flex items-center gap-2 text-sm font-bold tracking-[0.3em] text-emerald-300">
            <span
              className={cn(
                "h-3 w-3 rounded-full",
                isRecording ? "animate-pulse bg-rose-400" : "bg-emerald-300"
              )}
            />
            {getRecorderStatusText(state, !!recording)}
          </p>

          <div className="relative my-10">
            <div className="absolute inset-[-18px] rounded-full border border-emerald-200/10" />
            <div className="absolute inset-[-40px] rounded-full border border-emerald-200/5" />
            <Button
              type="button"
              size="icon-lg"
              variant={isRecording || isPaused ? "destructive" : "default"}
              disabled={isBusy}
              className={cn(
                "relative size-48 rounded-full border-0 text-base shadow-[0_0_0_8px_rgba(125,224,176,0.12),0_18px_40px_rgba(125,224,176,0.35)]",
                isRecording || isPaused
                  ? "bg-gradient-to-br from-emerald-300 to-emerald-500 text-white hover:from-emerald-300 hover:to-emerald-500"
                  : "bg-gradient-to-br from-emerald-300 to-emerald-500 text-slate-950 hover:from-emerald-300 hover:to-emerald-500"
              )}
              onClick={isRecording || isPaused ? handleStop : handleStart}
              aria-label={isRecording || isPaused ? "録音を停止" : "録音を開始"}
            >
              {isRecording || isPaused ? (
                <Square className="size-12 fill-current" />
              ) : (
                <Mic className="size-12" />
              )}
            </Button>
          </div>

          <div className="mb-8 flex h-10 items-end gap-2">
            {[10, 18, 12, 24, 14, 20, 16, 28, 18, 12, 22, 16, 26, 14, 20].map(
              (height, index) => (
                <span
                  key={`${height}-${index}`}
                  className="block w-1.5 rounded-full bg-emerald-300/65"
                  style={{ height }}
                />
              )
            )}
          </div>

          <p className="text-center text-base leading-8 text-white/54">
            そのまま
            <strong className="font-semibold text-emerald-300">
              レッスンに集中
            </strong>
            してください
            <br />
            停止後にAIが要点をまとめます
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {(isRecording || isPaused) && (
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={isPaused ? resume : pause}
                className="rounded-full border-white/15 bg-white/5 px-6 text-white hover:bg-white/10 hover:text-white"
              >
                {isPaused ? (
                  <Play data-icon="inline-start" />
                ) : (
                  <Pause data-icon="inline-start" />
                )}
                {isPaused ? "再開" : "一時停止"}
              </Button>
            )}

            {recording && state === "idle" && stage === "ready" ? (
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="rounded-full border-white/15 bg-white/5 px-6 text-white hover:bg-white/10 hover:text-white"
                onClick={resetRecording}
              >
                <RotateCcw className="mr-2 h-5 w-5" />
                もう一度録音
              </Button>
            ) : null}
          </div>

          {isRecording ? (
            <p className="mt-6 text-sm text-amber-200">
              録音中は画面ロックを防止しています。ブラウザや端末によっては画面を開いたままにしてください。
            </p>
          ) : null}

          {error ? (
            <p className="mt-6 w-full max-w-2xl rounded-2xl border border-rose-300/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </p>
          ) : null}

          {processingError ? (
            <div className="mt-6 w-full max-w-2xl rounded-2xl border border-rose-300/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p>{processingError}</p>
                {recording ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                    onClick={() => void retryCurrentStep()}
                  >
                    リトライ
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}

          {stage !== "idle" && stage !== "error" ? (
            <div className="mt-6 flex items-center gap-2 rounded-full border border-white/8 bg-white/8 px-4 py-2 text-sm text-white/80">
              <Loader2 className="h-4 w-4 animate-spin" />
              {processingText}
            </div>
          ) : null}
        </div>
      </section>

      {recording ? (
        <Card className="rounded-[28px] border-0 bg-white shadow-[0_16px_40px_rgba(15,31,46,0.08)] ring-1 ring-emerald-100">
          <CardHeader>
            <CardTitle className="text-2xl text-slate-950">
              録音データ
            </CardTitle>
            <CardDescription className="text-base leading-7">
              ブラウザで録音した内容を再生できます。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-950">録音プレビュー</p>
                <p className="text-xs text-slate-500">
                  {formatDuration(recording.duration)} /{" "}
                  {(recording.blob.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!canReset}
                onClick={resetRecording}
              >
                <RotateCcw data-icon="inline-start" />
                もう一度録音
              </Button>
            </div>

            <audio className="w-full" controls src={recording.url}>
              <track kind="captions" />
            </audio>

            {lessonId ? (
              <p className="text-sm text-slate-600">
                レッスンID: <span className="font-mono">{lessonId}</span>
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {transcript ? (
        <Card className="rounded-[28px] border-0 bg-white shadow-[0_16px_40px_rgba(15,31,46,0.08)] ring-1 ring-emerald-100">
          <CardHeader>
            <CardTitle className="text-2xl text-slate-950">
              文字起こし結果
            </CardTitle>
            <CardDescription className="text-base leading-7">
              Whisper APIによる文字起こし結果です。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              readOnly
              value={transcript}
              className="h-48 w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-800 outline-none"
            />
          </CardContent>
        </Card>
      ) : null}

      {stage === "ready" && studentSummary && teacherSummary ? (
        <div className="grid w-full gap-6 lg:grid-cols-2">
          <Card className="rounded-[28px] border-0 bg-[linear-gradient(135deg,#f5fcf8_0%,#ffffff_100%)] shadow-[0_16px_40px_rgba(15,31,46,0.08)] ring-1 ring-emerald-100">
            <CardHeader>
              <CardTitle className="text-2xl text-slate-950">
                生徒向けレッスンノート
              </CardTitle>
              <CardDescription className="text-base leading-7 text-slate-600">
                AIが要約しました
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {hasStudentSummaryContent(studentSummary) ? (
                <>
                  <SummarySection
                    title="今日学んだこと"
                    items={studentSummary.learned}
                  />
                  <SummarySection
                    title="よくできた点"
                    items={studentSummary.achievements}
                  />
                  <SummarySection
                    title="次回までの宿題"
                    items={studentSummary.homework}
                  />
                  {studentSummary.next_lesson_note?.trim() ? (
                    <section className="space-y-2">
                      <h4 className="text-sm font-semibold text-slate-900">
                        次回予定
                      </h4>
                      <p className="text-sm leading-6 text-slate-700">
                        {studentSummary.next_lesson_note}
                      </p>
                    </section>
                  ) : null}
                </>
              ) : (
                <EmptyState message="要約内容がありません" />
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-0 bg-white shadow-[0_16px_40px_rgba(15,31,46,0.08)] ring-1 ring-slate-200">
            <CardHeader>
              <CardTitle className="text-2xl text-slate-950">
                振り返りのためのメモ(講師用)
              </CardTitle>
              <CardDescription className="text-base leading-7 text-slate-600">
                AIが整理しました
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {hasTeacherSummaryContent(teacherSummary) ? (
                <>
                  {teacherSummary.lesson_flow?.trim() ? (
                    <section className="space-y-2">
                      <h4 className="text-sm font-semibold text-slate-900">
                        レッスンの流れ
                      </h4>
                      <p className="text-sm leading-6 text-slate-700">
                        {teacherSummary.lesson_flow}
                      </p>
                    </section>
                  ) : null}
                  <SummarySection
                    title="印象的な場面"
                    items={teacherSummary.teaching_highlights}
                  />
                  <SummarySection
                    title="観察された事実"
                    items={teacherSummary.observations}
                  />
                  <SummarySection
                    title="振り返りのための問い"
                    items={teacherSummary.questions_for_reflection}
                  />
                </>
              ) : (
                <EmptyState message="振り返りメモはまだありません" />
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </section>
  );
}
