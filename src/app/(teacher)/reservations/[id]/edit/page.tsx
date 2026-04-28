import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { updateReservationAction } from "@/actions/reservations";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

type StudentRow = {
  user_id: string;
  profile:
    | {
        display_name: string;
      }
    | Array<{
        display_name: string;
      }>
    | null;
};

const toDatetimeLocalValue = (value: string) => {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const extractName = (student: StudentRow) => {
  const profile = Array.isArray(student.profile)
    ? student.profile[0]
    : student.profile;

  return profile?.display_name ?? "生徒";
};

export default async function EditReservationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user || user.role !== "teacher") {
    redirect("/");
  }

  const supabase = createServiceClient();
  const [
    { data: reservation, error: reservationError },
    { data: students, error: studentsError },
    { data: schoolTeacher, error: schoolError },
    { data: locations, error: locationsError },
  ] =
    await Promise.all([
      supabase
        .from("reservations")
        .select(
          "id, school_id, student_id, scheduled_at, duration_minutes, location_id, notes"
        )
        .eq("id", id)
        .eq("teacher_id", user.id)
        .single(),
      supabase
        .from("students")
        .select(
          `
            user_id,
            profile:profiles!students_user_id_fkey(display_name)
          `
        )
        .eq("teacher_id", user.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("school_teachers")
        .select(
          `
            school_id,
            school:schools!inner(location_management_enabled)
          `
        )
        .eq("teacher_id", user.id)
        .order("joined_at", { ascending: true })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("locations")
        .select("id, name, school_id")
        .order("created_at", { ascending: true }),
    ]);

  if (reservationError) {
    throw new Error(reservationError.message);
  }

  if (studentsError) {
    throw new Error(studentsError.message);
  }

  if (schoolError) {
    throw new Error(schoolError.message);
  }

  if (locationsError && !locationsError.message.includes("public.locations")) {
    throw new Error(locationsError.message);
  }

  if (!reservation) {
    notFound();
  }

  const typedSchool = Array.isArray(schoolTeacher?.school)
    ? schoolTeacher.school[0]
    : schoolTeacher?.school;
  const schoolId = reservation.school_id ?? schoolTeacher?.school_id ?? "";
  const availableLocations = (locations ?? []).filter(
    (location) => !schoolId || location.school_id === schoolId
  );

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl px-5 py-8">
      <Card className="w-full rounded-lg border-0 bg-white ring-1 ring-neutral-200">
        <CardHeader>
          <CardTitle className="text-2xl">予約を編集</CardTitle>
          <CardDescription>
            録音前に予定を整えておくと、自動紐付けが安定します。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateReservationAction} className="space-y-6">
            <input type="hidden" name="reservation_id" value={reservation.id} />
            <input type="hidden" name="school_id" value={schoolId} />

            <div className="space-y-2">
              <Label htmlFor="student_id">生徒</Label>
              <select
                id="student_id"
                name="student_id"
                required
                defaultValue={reservation.student_id}
                className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-neutral-400"
              >
                {students?.map((student) => (
                  <option key={student.user_id} value={student.user_id}>
                    {extractName(student as StudentRow)}
                  </option>
                ))}
              </select>
            </div>

            {typedSchool?.location_management_enabled ? (
              <div className="space-y-2">
                <Label htmlFor="location_id">場所</Label>
                <select
                  id="location_id"
                  name="location_id"
                  defaultValue={reservation.location_id ?? ""}
                  className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-neutral-400"
                >
                  <option value="">未設定</option>
                  {availableLocations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="scheduled_at">日時</Label>
              <Input
                id="scheduled_at"
                name="scheduled_at"
                type="datetime-local"
                required
                defaultValue={toDatetimeLocalValue(reservation.scheduled_at)}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration_minutes">所要時間</Label>
              <select
                id="duration_minutes"
                name="duration_minutes"
                defaultValue={`${reservation.duration_minutes ?? 60}`}
                className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-neutral-400"
              >
                {[30, 45, 60, 90].map((duration) => (
                  <option key={duration} value={duration}>
                    {duration}分
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">メモ</Label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                defaultValue={reservation.notes ?? ""}
                className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-400"
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" size="lg">
                更新する
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <Link href="/reservations" className="text-sm text-neutral-500 underline underline-offset-4 hover:text-neutral-700">
              予約一覧へ戻る
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
