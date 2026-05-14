import { createServiceClient } from "@/lib/supabase/service";

export type ActiveStudentEnrollment = {
  user_id: string;
  teacher_id: string | null;
  school_id: string | null;
  default_location_id: string | null;
  start_date: string | null;
  status: string;
  notes: string | null;
};

const isNoRowsError = (message?: string) =>
  !!message &&
  (message.includes("JSON object requested") ||
    message.includes("The result contains 0 rows"));

export async function getActiveStudentEnrollment(
  userId: string
): Promise<ActiveStudentEnrollment | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("students")
    .select(
      "user_id, teacher_id, school_id, default_location_id, start_date, status, notes"
    )
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error && !isNoRowsError(error.message)) {
    throw new Error(error.message);
  }

  return (data as ActiveStudentEnrollment | null) ?? null;
}

export async function getOrBackfillStudentEnrollment(
  userId: string
): Promise<ActiveStudentEnrollment | null> {
  const supabase = createServiceClient();
  const currentStudent = await getActiveStudentEnrollment(userId);

  if (currentStudent?.school_id && currentStudent.teacher_id) {
    return currentStudent;
  }

  const { data: invitation, error: invitationError } = await supabase
    .from("invitations")
    .select(
      "school_id, student_teacher_id, default_location_id, accepted_at, status"
    )
    .eq("role", "student")
    .eq("accepted_by", userId)
    .eq("status", "accepted")
    .order("accepted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (invitationError && !isNoRowsError(invitationError.message)) {
    throw new Error(invitationError.message);
  }

  if (!invitation?.school_id || !invitation.student_teacher_id) {
    return currentStudent;
  }

  const { data: restoredStudent, error: restoreError } = await supabase
    .from("students")
    .upsert(
      {
        user_id: userId,
        school_id: currentStudent?.school_id ?? invitation.school_id,
        teacher_id: currentStudent?.teacher_id ?? invitation.student_teacher_id,
        default_location_id:
          currentStudent?.default_location_id ?? invitation.default_location_id,
        start_date:
          currentStudent?.start_date ?? new Date().toISOString().slice(0, 10),
        status: currentStudent?.status ?? "active",
        notes: currentStudent?.notes ?? null,
        deleted_at: null,
      },
      { onConflict: "user_id" }
    )
    .select(
      "user_id, teacher_id, school_id, default_location_id, start_date, status, notes"
    )
    .single();

  if (restoreError) {
    throw new Error(restoreError.message);
  }

  return restoredStudent as ActiveStudentEnrollment;
}
