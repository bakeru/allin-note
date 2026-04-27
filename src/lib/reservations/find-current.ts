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
  duration_minutes: number | null;
  status: string | null;
  student_id: string;
  student: ReservationStudent | ReservationStudent[] | null;
};

export type TodayReservation = {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  student_id: string;
  student_name: string;
};

const extractSingle = <T,>(value: T | T[] | null | undefined) => {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
};

export async function findTodayReservations(
  teacherId: string
): Promise<TodayReservation[]> {
  const supabase = createServiceClient();
  const today = new Date();
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from("reservations")
    .select(
      `
        id,
        scheduled_at,
        duration_minutes,
        status,
        student_id,
        student:students!inner(
          user_id,
          profile:profiles!inner(display_name)
        )
      `
    )
    .eq("teacher_id", teacherId)
    .gte("scheduled_at", startOfDay.toISOString())
    .lte("scheduled_at", endOfDay.toISOString())
    .order("scheduled_at", { ascending: true });

  if (error) {
    if (error.message.includes("public.reservations")) {
      return [];
    }

    throw new Error(error.message);
  }

  return (data as ReservationRow[] | null)?.map((reservation) => {
    const student = extractSingle(reservation.student);
    const profile = extractSingle(student?.profile);

    return {
      id: reservation.id,
      scheduled_at: reservation.scheduled_at,
      duration_minutes: reservation.duration_minutes ?? 60,
      status: reservation.status ?? "scheduled",
      student_id: reservation.student_id,
      student_name: profile?.display_name ?? "生徒",
    };
  }) ?? [];
}
