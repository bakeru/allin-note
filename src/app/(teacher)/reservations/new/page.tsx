import { redirect } from "next/navigation";

import { TeacherBookingFlowPage } from "@/components/reservations/teacher-booking-flow-page";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export default async function NewReservationPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "teacher") {
    redirect("/");
  }

  const supabase = createServiceClient();
  const [{ data: students, error }, { data: schoolTeacher, error: schoolError }, { data: locations, error: locationError }] =
    await Promise.all([
      supabase
        .from("students")
        .select(
          `
            user_id,
            default_location_id,
            school_id,
            profile:profiles!inner(display_name)
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
        .select(
          `
            id,
            name,
            type,
            area:areas(name),
            school_id
          `
        )
        .order("created_at", { ascending: true }),
    ]);

  if (error) throw new Error(error.message);
  if (schoolError) throw new Error(schoolError.message);
  if (locationError && !locationError.message.includes("public.locations")) {
    throw new Error(locationError.message);
  }

  const typedSchool = Array.isArray(schoolTeacher?.school)
    ? schoolTeacher.school[0]
    : schoolTeacher?.school;
  const schoolId =
    schoolTeacher?.school_id ??
    ((students?.[0] as { school_id?: string | null } | undefined)?.school_id ?? null);

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl px-5 py-8">
      <Card className="w-full rounded-lg border-0 bg-white ring-1 ring-neutral-200">
        <CardHeader>
          <CardTitle className="text-2xl">新しい予約を追加</CardTitle>
          <CardDescription>
            録音前に予約を作っておくと、録音開始時に生徒が自動で選ばれます。
          </CardDescription>
        </CardHeader>
        <CardContent>
          {schoolId ? (
            <TeacherBookingFlowPage
              teacherId={user.id}
              schoolId={schoolId}
              locationManagementEnabled={
                typedSchool?.location_management_enabled ?? false
              }
              students={(students ?? []).map((student) => ({
                id: student.user_id,
                displayName:
                  (Array.isArray(student.profile)
                    ? student.profile[0]
                    : student.profile)?.display_name ?? "生徒",
                defaultLocationId:
                  "default_location_id" in student
                    ? (student.default_location_id as string | null)
                    : null,
              }))}
              locations={(locations ?? [])
                .filter(
                  (location) =>
                    !schoolId ||
                    !("school_id" in location) ||
                    location.school_id === schoolId
                )
                .map((location) => ({
                  id: location.id,
                  name: location.name,
                  type: location.type,
                  areaName: (Array.isArray(location.area)
                    ? location.area[0]
                    : location.area)?.name,
                }))}
            />
          ) : (
            <p className="text-sm text-neutral-600">
              予約フローを使うには、講師を教室に紐付けてください。
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
