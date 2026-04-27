"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/get-current-user";
import { createServiceClient } from "@/lib/supabase/service";

export type StudentSummary = {
  learned?: string[];
  achievements?: string[];
  homework?: string[];
  next_lesson_note?: string;
};

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

export async function updateStudentSummary(
  lessonId: string,
  newSummary: StudentSummary
) {
  const user = await getCurrentUser();

  if (!user || user.role !== "teacher") {
    throw new Error("Unauthorized");
  }

  const supabase = createServiceClient();
  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select(
      `
        id,
        teacher_id,
        sent_at,
        summary_for_student,
        summary_for_student_original,
        summary_edited_count
      `
    )
    .eq("id", lessonId)
    .single();

  if (lessonError) {
    throw new Error(lessonError.message);
  }

  if (!lesson || lesson.teacher_id !== user.id) {
    throw new Error("Forbidden");
  }

  if (lesson.sent_at) {
    throw new Error("送信済みのため編集できません");
  }

  const updates: {
    summary_for_student: StudentSummary;
    summary_edited_at: string;
    summary_edited_count: number;
    summary_for_student_original?: unknown;
  } = {
    summary_for_student: newSummary,
    summary_edited_at: new Date().toISOString(),
    summary_edited_count: (lesson.summary_edited_count ?? 0) + 1,
  };

  if (!lesson.summary_for_student_original) {
    updates.summary_for_student_original = lesson.summary_for_student;
  }

  const { error } = await supabase
    .from("lessons")
    .update(updates)
    .eq("id", lessonId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/lessons/${lessonId}/edit`);
  revalidatePath(`/lessons/${lessonId}`);
  revalidatePath("/dashboard");
  revalidatePath("/student/dashboard");
}

export async function updateStudentSummaryAction(formData: FormData) {
  const lessonId = formData.get("lesson_id");
  const summaryJson = formData.get("summary_json");

  if (typeof lessonId !== "string" || !lessonId) {
    throw new Error("レッスンIDが見つかりません。");
  }

  if (typeof summaryJson !== "string" || !summaryJson) {
    throw new Error("要約データの形式が正しくありません。");
  }

  let parsedSummary: StudentSummary;

  try {
    parsedSummary = JSON.parse(summaryJson) as StudentSummary;
  } catch {
    throw new Error("要約データを読み取れませんでした。");
  }

  await updateStudentSummary(lessonId, parsedSummary);
  redirect(`/lessons/${lessonId}/edit`);
}
