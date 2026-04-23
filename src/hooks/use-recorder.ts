"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type RecorderState = "idle" | "recording" | "paused" | "stopping";

export type RecordingResult = {
  blob: Blob;
  url: string;
  mimeType: string;
  duration: number;
};

type UseRecorderOptions = {
  onRecordingComplete?: (result: RecordingResult) => void;
};

const RECORDING_TIMESLICE_MS = 60_000;
const AUDIO_BITS_PER_SECOND = 64_000;
const SAMPLE_RATE = 16_000;
const DEFAULT_MAX_RECORDING_MINUTES = 90;

const getMaxRecordingSeconds = () => {
  const rawValue = process.env.BETA_MAX_RECORDING_MINUTES;
  const minutes = rawValue ? Number(rawValue) : DEFAULT_MAX_RECORDING_MINUTES;

  if (!Number.isFinite(minutes) || minutes <= 0) {
    return DEFAULT_MAX_RECORDING_MINUTES * 60;
  }

  return minutes * 60;
};

const getSupportedMimeType = () => {
  const mimeTypes = [
    "audio/webm;codecs=opus",
    "audio/mp4",
    "audio/mpeg",
  ];

  if (typeof MediaRecorder === "undefined") {
    return "";
  }

  return (
    mimeTypes.find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) ?? ""
  );
};

export function useRecorder(options: UseRecorderOptions = {}) {
  const [state, setState] = useState<RecorderState>("idle");
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const timerRef = useRef<number | null>(null);
  const stopRef = useRef<() => Promise<RecordingResult | null>>(async () => null);
  const startedAtRef = useRef<number | null>(null);
  const recordedSecondsRef = useRef(0);
  const mimeTypeRef = useRef("");
  const pendingStopRef = useRef<{
    resolve: (result: RecordingResult | null) => void;
    reject: (error: Error) => void;
  } | null>(null);
  const onRecordingCompleteRef = useRef(options.onRecordingComplete);

  useEffect(() => {
    onRecordingCompleteRef.current = options.onRecordingComplete;
  }, [options.onRecordingComplete]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const calculateDuration = useCallback(() => {
    if (!startedAtRef.current) {
      return recordedSecondsRef.current;
    }

    return (
      recordedSecondsRef.current +
      (Date.now() - startedAtRef.current) / 1000
    );
  }, []);

  const updateDuration = useCallback(() => {
    const nextDuration = Math.floor(calculateDuration());
    setDuration(nextDuration);

    if (nextDuration >= getMaxRecordingSeconds()) {
      void stopRef.current();
    }
  }, [calculateDuration]);

  const startTimer = useCallback(() => {
    clearTimer();
    timerRef.current = window.setInterval(updateDuration, 500);
  }, [clearTimer, updateDuration]);

  const releaseWakeLock = useCallback(async () => {
    if (!wakeLockRef.current) return;

    try {
      await wakeLockRef.current.release();
    } catch {
      // Wake Lockの解放失敗は録音結果には影響しない
    } finally {
      wakeLockRef.current = null;
    }
  }, []);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const resetRecorder = useCallback(() => {
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    startedAtRef.current = null;
    recordedSecondsRef.current = 0;
    mimeTypeRef.current = "";
    setDuration(0);
  }, []);

  const requestWakeLock = useCallback(async () => {
    if (!("wakeLock" in navigator)) return;

    try {
      wakeLockRef.current = await navigator.wakeLock.request("screen");
    } catch {
      // Wake Lock非対応や拒否でも録音は続行する
    }
  }, []);

  const finalizeRecording = useCallback(async () => {
    clearTimer();
    await releaseWakeLock();
    stopStream();

    const finalDuration = Math.floor(calculateDuration());
    const blob = new Blob(chunksRef.current, {
      type: mimeTypeRef.current || "audio/webm",
    });
    const result =
      blob.size > 0
        ? {
            blob,
            url: URL.createObjectURL(blob),
            mimeType: blob.type,
            duration: finalDuration,
          }
        : null;

    resetRecorder();
    setState("idle");

    if (result) {
      setDuration(result.duration);
      onRecordingCompleteRef.current?.(result);
    }

    pendingStopRef.current?.resolve(result);
    pendingStopRef.current = null;
  }, [
    calculateDuration,
    clearTimer,
    releaseWakeLock,
    resetRecorder,
    stopStream,
  ]);

  const start = useCallback(async () => {
    if (state !== "idle") return;

    setError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("このブラウザは録音に対応していません。");
      return;
    }

    if (typeof MediaRecorder === "undefined") {
      setError("このブラウザはMediaRecorder APIに対応していません。");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: SAMPLE_RATE,
        },
      });
      const mimeType = getSupportedMimeType();
      const recorder = new MediaRecorder(stream, {
        ...(mimeType ? { mimeType } : {}),
        audioBitsPerSecond: AUDIO_BITS_PER_SECOND,
      });

      streamRef.current = stream;
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recordedSecondsRef.current = 0;
      startedAtRef.current = Date.now();
      mimeTypeRef.current = mimeType;

      recorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      });

      recorder.addEventListener("stop", () => {
        void finalizeRecording();
      });

      recorder.addEventListener("error", () => {
        setError("録音中にエラーが発生しました。");
      });

      await requestWakeLock();
      recorder.start(RECORDING_TIMESLICE_MS);
      setDuration(0);
      setState("recording");
      startTimer();
    } catch (unknownError) {
      await releaseWakeLock();
      stopStream();
      setState("idle");

      if (unknownError instanceof DOMException) {
        if (
          unknownError.name === "NotAllowedError" ||
          unknownError.name === "SecurityError"
        ) {
          setError("マイクの使用が許可されませんでした。");
          return;
        }

        if (unknownError.name === "NotFoundError") {
          setError("利用できるマイクが見つかりません。");
          return;
        }
      }

      setError("録音を開始できませんでした。");
    }
  }, [
    finalizeRecording,
    releaseWakeLock,
    requestWakeLock,
    startTimer,
    state,
    stopStream,
  ]);

  const stop = useCallback(async (): Promise<RecordingResult | null> => {
    const recorder = mediaRecorderRef.current;

    if (!recorder || state === "idle" || state === "stopping") {
      return null;
    }

    setState("stopping");
    recordedSecondsRef.current = calculateDuration();
    startedAtRef.current = null;
    clearTimer();

    return new Promise<RecordingResult | null>((resolve, reject) => {
      pendingStopRef.current = { resolve, reject };

      try {
        if (recorder.state !== "inactive") {
          recorder.requestData();
          recorder.stop();
        } else {
          void finalizeRecording();
        }
      } catch (unknownError) {
        const nextError =
          unknownError instanceof Error
            ? unknownError
            : new Error("録音の停止に失敗しました。");
        pendingStopRef.current = null;
        setError(nextError.message);
        reject(nextError);
      }
    });
  }, [calculateDuration, clearTimer, finalizeRecording, state]);

  useEffect(() => {
    stopRef.current = stop;
  }, [stop]);

  const pause = useCallback(() => {
    const recorder = mediaRecorderRef.current;

    if (!recorder || state !== "recording") return;

    recordedSecondsRef.current = calculateDuration();
    startedAtRef.current = null;
    recorder.pause();
    clearTimer();
    setState("paused");
  }, [calculateDuration, clearTimer, state]);

  const resume = useCallback(() => {
    const recorder = mediaRecorderRef.current;

    if (!recorder || state !== "paused") return;

    startedAtRef.current = Date.now();
    recorder.resume();
    setState("recording");
    startTimer();
  }, [startTimer, state]);

  useEffect(() => {
    return () => {
      clearTimer();
      void releaseWakeLock();
      stopStream();
    };
  }, [clearTimer, releaseWakeLock, stopStream]);

  return {
    start,
    stop,
    pause,
    resume,
    state,
    duration,
    error,
  };
}
