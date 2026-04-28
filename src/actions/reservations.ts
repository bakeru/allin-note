"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/get-current-user";
import { createServiceClient } from "@/lib/supabase/service";

const ALLOWED_DURATIONS = new Set([30, 45, 60, 90]);

export type ReservationPayload = {
  schoolId: string;
  teacherId: string;
  studentId: string;
  scheduledAt: string;
  durationMinutes: number;
  locationId?: string | null;
  notes?: string | null;
};

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

const validatePayload = (payload: ReservationPayload) => {
  if (!payload.schoolId) {
    throw new Error("教室IDが見つかりません。");
  }

  if (!payload.teacherId) {
    throw new Error("講師IDが見つかりません。");
  }

  if (!payload.studentId) {
    throw new Error("生徒を選択してください。");
  }

  if (!payload.scheduledAt) {
    throw new Error("日時を入力してください。");
  }

  const parsedDate = new Date(payload.scheduledAt);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error("予約日時の形式が正しくありません。");
  }

  if (!ALLOWED_DURATIONS.has(payload.durationMinutes)) {
    throw new Error("所要時間は30/45/60/90分から選択してください。");
  }

  return {
    schoolId: payload.schoolId,
    teacherId: payload.teacherId,
    studentId: payload.studentId,
    scheduledAt: parsedDate.toISOString(),
    durationMinutes: payload.durationMinutes,
    locationId: payload.locationId ?? null,
    notes: payload.notes?.trim() ? payload.notes.trim() : null,
  };
};

export async function createReservationByPayload(payload: ReservationPayload) {
  const user = await getCurrentUser();

  if (!user || (user.role !== "teacher" && user.role !== "student")) {
    throw new Error("予約を作成できるユーザーではありません。");
  }

  const supabase = createServiceClient();
  const normalized = validatePayload(payload);

  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("user_id, teacher_id, school_id")
    .eq("user_id", normalized.studentId)
    .is("deleted_at", null)
    .single();

  if (studentError) {
    throw new Error(studentError.message);
  }

  if (!student || student.school_id !== normalized.schoolId) {
    throw new Error("この生徒には予約を作成できません。");
  }

  if (user.role === "teacher") {
    if (payload.teacherId !== user.id || student.teacher_id !== user.id) {
      throw new Error("自分の担当生徒のみ予約できます。");
    }

    const { data: schoolTeacher, error: membershipError } = await supabase
      .from("school_teachers")
      .select("id")
      .eq("school_id", normalized.schoolId)
      .eq("teacher_id", user.id)
      .single();

    if (membershipError) {
      throw new Error(membershipError.message);
    }

    if (!schoolTeacher) {
      throw new Error("この教室の予約は作成できません。");
    }
  } else {
    if (student.user_id !== user.id || student.teacher_id !== normalized.teacherId) {
      throw new Error("自分の予約のみ作成できます。");
    }
  }

  if (normalized.locationId) {
    const { data: location, error: locationError } = await supabase
      .from("locations")
      .select("id")
      .eq("id", normalized.locationId)
      .eq("school_id", normalized.schoolId)
      .is("deleted_at", null)
      .single();

    if (locationError) {
      throw new Error(locationError.message);
    }

    if (!location) {
      throw new Error("場所が見つかりません。");
    }
  }

  const { data: reservation, error } = await supabase
    .from("reservations")
    .insert({
      school_id: normalized.schoolId,
      teacher_id: normalized.teacherId,
      student_id: normalized.studentId,
      scheduled_at: normalized.scheduledAt,
      duration_minutes: normalized.durationMinutes,
      location_id: normalized.locationId,
      notes: normalized.notes,
      status: "scheduled",
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/reservations");
  revalidatePath("/record");
  revalidatePath("/student/dashboard");

  return reservation.id as string;
}

export async function createReservationAction(formData: FormData) {
  const user = await getTeacherUser();
  const schoolId = formData.get("school_id");
  const locationId = formData.get("location_id");
  const payload = parseReservationPayload(formData);

  if (typeof schoolId !== "string" || !schoolId) {
    throw new Error("教室IDが見つかりません。");
  }

  await createReservationByPayload({
    schoolId,
    teacherId: user.id,
    studentId: payload.studentId,
    scheduledAt: payload.scheduledAt,
    durationMinutes: payload.durationMinutes,
    locationId: typeof locationId === "string" && locationId ? locationId : null,
    notes: payload.notes,
  });

  redirect("/reservations");
}

export async function updateReservationAction(formData: FormData) {
  const user = await getTeacherUser();
  const supabase = createServiceClient();
  const reservationId = formData.get("reservation_id");
  const schoolId = formData.get("school_id");
  const locationId = formData.get("location_id");

  if (typeof reservationId !== "string" || !reservationId) {
    throw new Error("予約IDが見つかりません。");
  }

  if (typeof schoolId !== "string" || !schoolId) {
    throw new Error("教室IDが見つかりません。");
  }

  const payload = parseReservationPayload(formData);

  const { error } = await supabase
    .from("reservations")
    .update({
      school_id: schoolId,
      student_id: payload.studentId,
      scheduled_at: payload.scheduledAt,
      duration_minutes: payload.durationMinutes,
      location_id: typeof locationId === "string" && locationId ? locationId : null,
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

export async function cancelReservationAction(
  reservationId: string,
  reason?: string
) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const supabase = createServiceClient();
  const { data: reservation, error } = await supabase
    .from("reservations")
    .select(
      `
        id,
        school_id,
        teacher_id,
        student_id,
        scheduled_at,
        status,
        school:schools!reservations_school_id_fkey(
          cancellation_deadline_hours,
          late_cancellation_policy
        )
      `
    )
    .eq("id", reservationId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (!reservation) {
    throw new Error("Not found");
  }

  const isStudent = user.id === reservation.student_id;
  const isTeacher = user.id === reservation.teacher_id;

  if (!isStudent && !isTeacher) {
    throw new Error("Forbidden");
  }

  let newStatus = "cancelled";
  const school = Array.isArray(reservation.school)
    ? reservation.school[0]
    : reservation.school;

  if (isTeacher && !isStudent) {
    newStatus = "cancelled_by_teacher";
  } else {
    const reservationStart = new Date(reservation.scheduled_at);
    const now = new Date();
    const hoursUntilLesson =
      (reservationStart.getTime() - now.getTime()) / (60 * 60 * 1000);
    const deadline = school?.cancellation_deadline_hours ?? 24;
    const policy = school?.late_cancellation_policy ?? "consume";

    if (hoursUntilLesson < deadline) {
      if (policy === "no_cancel") {
        throw new Error(
          `キャンセル期限(${deadline}時間前)を過ぎています。教室に直接ご連絡ください。`
        );
      }

      newStatus = "cancelled_late";
    }
  }

  const { error: updateError } = await supabase
    .from("reservations")
    .update({
      status: newStatus,
      cancelled_at: new Date().toISOString(),
      cancelled_by: user.id,
      cancellation_reason: reason?.trim() ? reason.trim() : null,
    })
    .eq("id", reservationId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  revalidatePath("/reservations");
  revalidatePath("/record");
  revalidatePath("/student/dashboard");

  return newStatus;
}
