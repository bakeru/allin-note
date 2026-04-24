import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

import { getCurrentUser } from "@/lib/auth/get-current-user";
import { deleteAudio, uploadAudio } from "@/lib/storage/r2";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

const MAX_AUDIO_SIZE_BYTES = 60 * 1024 * 1024;

const getAudioExtension = (contentType: string) => {
  if (contentType.includes("webm")) return "webm";
  if (contentType.includes("mp4")) return "m4a";
  if (contentType.includes("mpeg")) return "mp3";
  return "webm";
};

const parseDurationSeconds = (value: FormDataEntryValue | null) => {
  if (typeof value !== "string") return null;

  const duration = Number.parseInt(value, 10);

  if (!Number.isFinite(duration) || duration < 0) {
    return null;
  }

  return duration;
};

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user || user.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const contentType = request.headers.get("content-type");

    if (
      !contentType?.includes("multipart/form-data") &&
      !contentType?.includes("application/x-www-form-urlencoded")
    ) {
      return NextResponse.json(
        { error: "音声ファイルはFormDataで送信してください。" },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("audio");
    const studentId = formData.get("student_id");
    const reservationId = formData.get("reservation_id");
    const durationSeconds = parseDurationSeconds(
      formData.get("duration_seconds")
    );

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "音声ファイルが見つかりません。" },
        { status: 400 }
      );
    }

    if (file.size <= 0) {
      return NextResponse.json(
        { error: "音声ファイルが空です。" },
        { status: 400 }
      );
    }

    if (file.size > MAX_AUDIO_SIZE_BYTES) {
      return NextResponse.json(
        { error: "音声ファイルのサイズが大きすぎます。" },
        { status: 413 }
      );
    }

    if (typeof studentId !== "string" || !studentId) {
      return NextResponse.json(
        { error: "開発用の生徒IDが設定されていません。" },
        { status: 400 }
      );
    }

    if (
      reservationId !== null &&
      (typeof reservationId !== "string" || !reservationId)
    ) {
      return NextResponse.json(
        { error: "予約IDの形式が正しくありません。" },
        { status: 400 }
      );
    }

    if (durationSeconds === null) {
      return NextResponse.json(
        { error: "録音時間を取得できませんでした。" },
        { status: 400 }
      );
    }

    const lessonId = uuidv4();
    const audioKey = `${user.id}/${lessonId}.${getAudioExtension(file.type)}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    await uploadAudio(audioKey, buffer, file.type || "application/octet-stream");

    const supabase = createServiceClient();
    const audioExpiresAt = new Date();
    audioExpiresAt.setDate(audioExpiresAt.getDate() + 90);

    const { data, error } = await supabase
      .from("lessons")
      .insert({
        id: lessonId,
        teacher_id: user.id,
        student_id: studentId,
        recorded_at: new Date().toISOString(),
        duration_seconds: durationSeconds,
        audio_path: audioKey,
        audio_expires_at: audioExpiresAt.toISOString(),
        status: "uploading",
        reservation_id: reservationId || null,
      })
      .select("id")
      .single();

    if (error) {
      await deleteAudio(audioKey).catch(() => undefined);

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (reservationId) {
      const { error: reservationError } = await supabase
        .from("reservations")
        .update({ status: "completed" })
        .eq("id", reservationId)
        .eq("teacher_id", user.id);

      if (reservationError) {
        return NextResponse.json(
          { error: reservationError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      lesson_id: data.id,
      audio_path: audioKey,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "アップロード中にエラーが発生しました。";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
