"use client";

import { Loader2, Mic, Pause, Play, RotateCcw, Square } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import {
  type StudentSummary,
  type TeacherSummary,
} from "@/lib/ai/summarizer";
import {
  type RecordingResult,
  type RecorderState,
  useRecorder,
} from "@/hooks/use-recorder";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  items: string[];
}) {
  if (!items.length) return null;

  return (
    <section className="space-y-2">
      <h4 className="text-sm font-semibold text-neutral-900">{title}</h4>
      <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-neutral-700">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

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

  const uploadRecording = useCallback(async (nextRecording: RecordingResult) => {
    const activeStudentId = studentId ?? DEV_STUDENT_ID;

    if (!activeStudentId) {
      setStage("error");
      setProcessingError(".env.localにNEXT_PUBLIC_DEV_STUDENT_IDを設定してください。");
      return null;
    }

    setStage("uploading");
    setProcessingError(null);

    const formData = new FormData();
    formData.append(
      "audio",
      nextRecording.blob,
      `recording.${nextRecording.mimeType.includes("mp4") ? "m4a" : "webm"}`
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
  }, [reservationId, studentId]);

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

    if (
      !response.ok ||
      !body.student_summary ||
      !body.teacher_summary
    ) {
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

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col items-center px-5 py-10 text-center">
      {studentName ? (
        <p className="mb-4 text-sm font-medium text-neutral-600">
          {state === "recording" || state === "paused"
            ? `${studentName}さんのレッスン録音中`
            : `${studentName}さんのレッスンを録音します`}
        </p>
      ) : null}

      <div
        className={cn(
          "mb-8 rounded-full border px-4 py-1.5 text-sm font-medium",
          isRecording
            ? "border-red-200 bg-red-50 text-red-700"
            : "border-neutral-200 bg-white text-neutral-600"
        )}
      >
        {getRecorderStatusText(state, !!recording)}
      </div>

      <p
        className={cn(
          "mb-8 font-mono text-7xl font-semibold tracking-normal tabular-nums sm:text-8xl",
          isRecording ? "text-red-600" : "text-neutral-950"
        )}
      >
        {formatDuration(activeDuration)}
      </p>

      <Button
        type="button"
        size="icon-lg"
        variant={isRecording || isPaused ? "destructive" : "default"}
        disabled={isBusy}
        className={cn(
          "mb-5 size-28 rounded-full shadow-lg transition-transform active:scale-95 sm:size-32",
          isRecording || isPaused
            ? "bg-red-600 text-white hover:bg-red-700"
            : "bg-neutral-950 text-white hover:bg-neutral-800"
        )}
        onClick={isRecording || isPaused ? handleStop : handleStart}
        aria-label={isRecording || isPaused ? "録音を停止" : "録音を開始"}
      >
        {isRecording || isPaused ? (
          <Square className="size-10 fill-current" />
        ) : (
          <Mic className="size-11" />
        )}
      </Button>

      <div className="mb-6 h-10">
        {(isRecording || isPaused) && (
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={isPaused ? resume : pause}
            className="min-w-36"
          >
            {isPaused ? (
              <Play data-icon="inline-start" />
            ) : (
              <Pause data-icon="inline-start" />
            )}
            {isPaused ? "再開" : "一時停止"}
          </Button>
        )}
      </div>

      {isRecording && (
        <p className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          録音中は画面ロックを防止しています。ブラウザや端末によっては画面を開いたままにしてください。
        </p>
      )}

      {error && (
        <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {recording && (
        <div className="mt-4 w-full rounded-lg border border-neutral-200 bg-white p-4 text-left shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-neutral-950">録音プレビュー</p>
              <p className="text-xs text-neutral-500">
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

          {(processingText || processingError || lessonId) && (
            <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm">
              {processingText && stage !== "ready" && stage !== "error" && (
                <p className="flex items-center gap-2 text-neutral-700">
                  <Loader2 className="size-4 animate-spin" />
                  {processingText}
                </p>
              )}

              {lessonId && (
                <p className="mt-2 text-neutral-600">
                  レッスンID: <span className="font-mono">{lessonId}</span>
                </p>
              )}

              {processingError && (
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-red-700">{processingError}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void retryCurrentStep()}
                  >
                    リトライ
                  </Button>
                </div>
              )}
            </div>
          )}

          {transcript && (
            <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
              <p className="mb-3 text-sm font-medium text-neutral-900">
                文字起こし結果
              </p>
              <textarea
                readOnly
                value={transcript}
                className="h-48 w-full resize-y rounded-md border border-neutral-200 bg-white p-3 text-sm leading-6 text-neutral-800 outline-none"
              />
            </div>
          )}
        </div>
      )}

      {stage === "ready" && studentSummary && teacherSummary && (
        <div className="mt-8 grid w-full gap-6 lg:grid-cols-2">
          <Card className="border border-sky-100 bg-sky-50/80 ring-0">
            <CardHeader>
              <CardTitle className="text-sky-950">
                生徒向けレッスンノート
              </CardTitle>
              <CardDescription className="text-sky-800">
                AIが要約しました
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
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
              {studentSummary.next_lesson_note && (
                <section className="space-y-2">
                  <h4 className="text-sm font-semibold text-sky-950">
                    次回予定
                  </h4>
                  <p className="text-sm leading-6 text-sky-900">
                    {studentSummary.next_lesson_note}
                  </p>
                </section>
              )}
            </CardContent>
          </Card>

          <Card className="border border-neutral-200 bg-neutral-50 ring-0">
            <CardHeader>
              <CardTitle className="text-neutral-950">
                振り返りのためのメモ(講師用)
              </CardTitle>
              <CardDescription>AIが整理しました</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <section className="space-y-2">
                <h4 className="text-sm font-semibold text-neutral-950">
                  レッスンの流れ
                </h4>
                <p className="text-sm leading-6 text-neutral-700">
                  {teacherSummary.lesson_flow}
                </p>
              </section>
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
            </CardContent>
          </Card>
        </div>
      )}
    </section>
  );
}
