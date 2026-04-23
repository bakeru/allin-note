import { type NextRequest, NextResponse } from "next/server";

import { generateBothSummaries } from "@/lib/ai/summarizer";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const maxDuration = 300;

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
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
    .select("id, transcript, teacher_id")
    .eq("id", lessonId)
    .single();

  if (lessonError || !lesson) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  if (lesson.teacher_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!lesson.transcript) {
    return NextResponse.json(
      { error: "Transcript not available" },
      { status: 400 }
    );
  }

  await supabase
    .from("lessons")
    .update({ status: "summarizing", error_message: null })
    .eq("id", lessonId);

  try {
    const { studentSummary, teacherSummary } = await generateBothSummaries(
      lesson.transcript
    );

    const { error: updateError } = await supabase
      .from("lessons")
      .update({
        summary_for_student: studentSummary,
        summary_for_teacher: teacherSummary,
        status: "ready",
        error_message: null,
      })
      .eq("id", lessonId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return NextResponse.json({
      success: true,
      student_summary: studentSummary,
      teacher_summary: teacherSummary,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "要約生成中にエラーが発生しました。";

    await supabase
      .from("lessons")
      .update({
        error_message: message,
      })
      .eq("id", lessonId);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
