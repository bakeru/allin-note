"use client";

import { Pause, Play, RotateCcw, Square, Mic } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import {
  type RecordingResult,
  type RecorderState,
  useRecorder,
} from "@/hooks/use-recorder";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const formatDuration = (duration: number) => {
  const minutes = Math.floor(duration / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(duration % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${seconds}`;
};

const getStatusText = (state: RecorderState, hasRecording: boolean) => {
  if (state === "recording") return "録音中";
  if (state === "paused") return "一時停止中";
  if (state === "stopping") return "録音を保存中";
  if (hasRecording) return "録音完了";
  return "待機中";
};

export function RecorderPanel() {
  const [recording, setRecording] = useState<RecordingResult | null>(null);
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
  }, [recording]);

  const handleStart = async () => {
    resetRecording();
    await start();
  };

  const handleStop = async () => {
    await stop();
  };

  const isRecording = state === "recording";
  const isPaused = state === "paused";
  const isBusy = state === "stopping";
  const activeDuration = recording?.duration ?? duration;

  return (
    <section className="mx-auto flex w-full max-w-xl flex-col items-center px-5 py-10 text-center">
      <div
        className={cn(
          "mb-8 rounded-full border px-4 py-1.5 text-sm font-medium",
          isRecording
            ? "border-red-200 bg-red-50 text-red-700"
            : "border-neutral-200 bg-white text-neutral-600"
        )}
      >
        {getStatusText(state, !!recording)}
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
              onClick={resetRecording}
            >
              <RotateCcw data-icon="inline-start" />
              もう一度録音
            </Button>
          </div>
          <audio className="w-full" controls src={recording.url}>
            <track kind="captions" />
          </audio>
        </div>
      )}
    </section>
  );
}
