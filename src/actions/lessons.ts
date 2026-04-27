"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/get-current-user";
import { createServiceClient } from "@/lib/supabase/service";

export async function saveTeacherMessage(
  lessonId: string,
  message: string,
  shouldSend: boolean
) {
  const user = await getCurrentUser();

  if (!user || user.role !== "teacher") {
    throw new Error("Unauthorized");
  }

  const supabase = createServiceClient();
  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select("id, teacher_id")
    .eq("id", lessonId)
    .single();

  if (lessonError) {
    throw new Error(lessonError.message);
  }

  if (!lesson || lesson.teacher_id !== user.id) {
    throw new Error("Forbidden");
  }

  const updates: {
    teacher_message: string;
    updated_at: string;
    sent_at?: string;
  } = {
    teacher_message: message,
    updated_at: new Date().toISOString(),
  };

  if (shouldSend) {
    updates.sent_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("lessons")
    .update(updates)
    .eq("id", lessonId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/student/dashboard");
  revalidatePath(`/lessons/${lessonId}`);
  revalidatePath(`/lessons/${lessonId}/edit`);
}

export async function saveTeacherMessageAction(formData: FormData) {
  const lessonId = formData.get("lesson_id");
  const teacherMessage = formData.get("teacher_message");
  const intent = formData.get("intent");

  if (typeof lessonId !== "string" || !lessonId) {
    throw new Error("レッスンIDが見つかりません。");
  }

  if (typeof teacherMessage !== "string") {
    throw new Error("メッセージの形式が正しくありません。");
  }

  await saveTeacherMessage(lessonId, teacherMessage.trim(), intent === "send");
  redirect(`/lessons/${lessonId}/edit`);
}
