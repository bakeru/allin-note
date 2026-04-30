"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/get-current-user";
import { sendEmail } from "@/lib/email/send";
import { lessonNoteEmail } from "@/lib/email/templates/lesson-note";
import { createServiceClient } from "@/lib/supabase/service";
import { buildAppUrl } from "@/lib/utils/app-url";

export type StudentSummary = {
  learned?: string[];
  achievements?: string[];
  homework?: string[];
  next_lesson_note?: string;
};

const renderStudentSummaryText = (summary: StudentSummary | null) => {
  if (!summary) {
    return "今回のレッスン要約はまだありません。";
  }

  const sections = [
    summary.learned?.length
      ? `今日学んだこと\n${summary.learned.map((item) => `・${item}`).join("\n")}`
      : null,
    summary.achievements?.length
      ? `よくできた点\n${summary.achievements.map((item) => `・${item}`).join("\n")}`
      : null,
    summary.homework?.length
      ? `次回までの宿題\n${summary.homework.map((item) => `・${item}`).join("\n")}`
      : null,
    summary.next_lesson_note?.trim()
      ? `次回予定\n${summary.next_lesson_note.trim()}`
      : null,
  ].filter(Boolean);

  return sections.length ? sections.join("\n\n") : "今回のレッスン要約はまだありません。";
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

  if (shouldSend) {
    const { data: mailLesson, error: mailLessonError } = await supabase
      .from("lessons")
      .select(
        `
          id,
          recorded_at,
          teacher_message,
          summary_for_student,
          student:students!inner(
            user:profiles!students_user_id_fkey(
              email,
              display_name
            )
          )
        `
      )
      .eq("id", lessonId)
      .single();

    if (!mailLessonError && mailLesson) {
      const student = Array.isArray(mailLesson.student)
        ? mailLesson.student[0]
        : mailLesson.student;
      const studentUser = Array.isArray(student?.user) ? student.user[0] : student?.user;

      if (studentUser?.email) {
        const parsedSummary =
          typeof mailLesson.summary_for_student === "string"
            ? (JSON.parse(mailLesson.summary_for_student) as StudentSummary)
            : ((mailLesson.summary_for_student as StudentSummary | null) ?? null);

        const { subject, html } = lessonNoteEmail({
          studentName: studentUser.display_name ?? "生徒",
          teacherName: user.display_name,
          lessonDate: new Date(mailLesson.recorded_at),
          teacherMessage: mailLesson.teacher_message ?? "",
          summary: renderStudentSummaryText(parsedSummary),
          lessonUrl: buildAppUrl(`/lessons/${lessonId}`),
        });

        await sendEmail({
          to: studentUser.email,
          subject,
          html,
        });
      }
    }
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
