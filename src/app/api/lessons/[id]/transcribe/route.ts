import { type NextRequest, NextResponse } from "next/server";

import { transcribeAudio } from "@/lib/ai/whisper";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { downloadAudio } from "@/lib/storage/r2";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const maxDuration = 300;

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const getMimeTypeFromPath = (audioPath: string) => {
  const ext = audioPath.split(".").pop() || "webm";

  if (ext === "webm") return { ext, mimeType: "audio/webm" };
  if (ext === "m4a") return { ext, mimeType: "audio/mp4" };
  if (ext === "mp4") return { ext, mimeType: "audio/mp4" };
  return { ext, mimeType: "audio/mpeg" };
};

export async function POST(_request: NextRequest, { params }: RouteContext) {
  const { id: lessonId } = await params;
  const user = await getCurrentUser();

  if (!user || user.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select("id, audio_path, teacher_id")
    .eq("id", lessonId)
    .single();

  if (lessonError || !lesson) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  if (lesson.teacher_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!lesson.audio_path) {
    return NextResponse.json(
      { error: "音声ファイルが登録されていません。" },
      { status: 400 }
    );
  }

  await supabase
    .from("lessons")
    .update({ status: "transcribing", error_message: null })
    .eq("id", lessonId);

  try {
    const audioBuffer = await downloadAudio(lesson.audio_path);
    const { ext, mimeType } = getMimeTypeFromPath(lesson.audio_path);
    const transcript = await transcribeAudio(
      audioBuffer,
      `audio.${ext}`,
      mimeType
    );

    const { error: updateError } = await supabase
      .from("lessons")
      .update({
        transcript,
        status: "summarizing",
        error_message: null,
      })
      .eq("id", lessonId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return NextResponse.json({
      success: true,
      transcript,
      lesson_id: lessonId,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "文字起こし中にエラーが発生しました。";

    await supabase
      .from("lessons")
      .update({
        status: "recording",
        error_message: message,
      })
      .eq("id", lessonId);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
