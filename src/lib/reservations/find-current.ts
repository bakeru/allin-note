import { createServiceClient } from "@/lib/supabase/service";

type ReservationStudentProfile = {
  display_name: string;
};

type ReservationStudent = {
  user_id: string;
  profile: ReservationStudentProfile | ReservationStudentProfile[] | null;
};

type ReservationRow = {
  id: string;
  scheduled_at: string;
  student_id: string;
  student: ReservationStudent | ReservationStudent[] | null;
};

export type RecordingReservation = {
  id: string;
  scheduled_at: string;
  student_id: string;
  student_name: string;
};

const extractSingle = <T,>(value: T | T[] | null | undefined) => {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
};

export async function findReservationForRecording(
  teacherId: string
): Promise<RecordingReservation | null> {
  const supabase = createServiceClient();
  const now = new Date();
  const thirtyMinutesBefore = new Date(now.getTime() - 30 * 60 * 1000);
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

  const { data, error } = await supabase
    .from("reservations")
    .select(
      `
        id,
        scheduled_at,
        student_id,
        student:students!inner(
          user_id,
          profile:profiles!inner(display_name)
        )
      `
    )
    .eq("teacher_id", teacherId)
    .eq("status", "scheduled")
    .gte("scheduled_at", thirtyMinutesBefore.toISOString())
    .lte("scheduled_at", oneHourLater.toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(1);

  if (error) {
    if (error.message.includes("public.reservations")) {
      return null;
    }

    throw new Error(error.message);
  }

  const reservation = (data?.[0] as ReservationRow | undefined) ?? null;

  if (!reservation) {
    return null;
  }

  const student = extractSingle(reservation.student);
  const profile = extractSingle(student?.profile);

  return {
    id: reservation.id,
    scheduled_at: reservation.scheduled_at,
    student_id: reservation.student_id,
    student_name: profile?.display_name ?? "生徒",
  };
}
