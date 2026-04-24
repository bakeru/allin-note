"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/get-current-user";
import { createServiceClient } from "@/lib/supabase/service";

const ALLOWED_DURATIONS = new Set([30, 45, 60, 90]);

const parseReservationPayload = (formData: FormData) => {
  const studentId = formData.get("student_id");
  const scheduledAt = formData.get("scheduled_at");
  const durationValue = formData.get("duration_minutes");
  const notes = formData.get("notes");

  if (typeof studentId !== "string" || !studentId) {
    throw new Error("生徒を選択してください。");
  }

  if (typeof scheduledAt !== "string" || !scheduledAt) {
    throw new Error("日時を入力してください。");
  }

  const parsedDate = new Date(scheduledAt);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error("予約日時の形式が正しくありません。");
  }

  const parsedDuration =
    typeof durationValue === "string"
      ? Number.parseInt(durationValue, 10)
      : Number.NaN;

  if (!ALLOWED_DURATIONS.has(parsedDuration)) {
    throw new Error("所要時間は30/45/60/90分から選択してください。");
  }

  return {
    studentId,
    scheduledAt: parsedDate.toISOString(),
    durationMinutes: parsedDuration,
    notes: typeof notes === "string" ? notes.trim() : "",
  };
};

const getTeacherUser = async () => {
  const user = await getCurrentUser();

  if (!user || user.role !== "teacher") {
    throw new Error("講師としてログインしてください。");
  }

  return user;
};

export async function createReservationAction(formData: FormData) {
  const user = await getTeacherUser();
  const supabase = createServiceClient();
  const payload = parseReservationPayload(formData);

  const { error } = await supabase.from("reservations").insert({
    teacher_id: user.id,
    student_id: payload.studentId,
    scheduled_at: payload.scheduledAt,
    duration_minutes: payload.durationMinutes,
    notes: payload.notes || null,
    status: "scheduled",
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/reservations");
  redirect("/reservations");
}

export async function updateReservationAction(formData: FormData) {
  const user = await getTeacherUser();
  const supabase = createServiceClient();
  const reservationId = formData.get("reservation_id");

  if (typeof reservationId !== "string" || !reservationId) {
    throw new Error("予約IDが見つかりません。");
  }

  const payload = parseReservationPayload(formData);

  const { error } = await supabase
    .from("reservations")
    .update({
      student_id: payload.studentId,
      scheduled_at: payload.scheduledAt,
      duration_minutes: payload.durationMinutes,
      notes: payload.notes || null,
    })
    .eq("id", reservationId)
    .eq("teacher_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/reservations");
  redirect("/reservations");
}

export async function deleteReservationAction(formData: FormData) {
  const user = await getTeacherUser();
  const supabase = createServiceClient();
  const reservationId = formData.get("reservation_id");

  if (typeof reservationId !== "string" || !reservationId) {
    throw new Error("予約IDが見つかりません。");
  }

  const { error } = await supabase
    .from("reservations")
    .delete()
    .eq("id", reservationId)
    .eq("teacher_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/reservations");
}
