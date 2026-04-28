import { redirect } from "next/navigation";

import { StudentBookingFlowPage } from "@/components/reservations/student-booking-flow-page";
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

export default async function StudentNewReservationPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "student") {
    redirect("/");
  }

  const supabase = createServiceClient();
  const { data: student, error } = await supabase
    .from("students")
    .select("user_id, teacher_id, school_id, default_location_id")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (!student?.school_id) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl px-5 py-8">
        <Card className="w-full rounded-lg border-0 bg-white ring-1 ring-sky-100">
          <CardHeader>
            <CardTitle className="text-2xl text-slate-950">
              予約できる教室がまだ設定されていません
            </CardTitle>
            <CardDescription className="text-slate-600">
              教室側で所属設定が完了すると、ここから予約できるようになります。
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const [{ data: schoolTeacher }, { data: locations, error: locationError }] =
    await Promise.all([
      supabase
        .from("schools")
        .select("id, location_management_enabled")
        .eq("id", student.school_id)
        .is("deleted_at", null)
        .single(),
      supabase
        .from("locations")
        .select(
          `
            id,
            name,
            type,
            area:areas(name)
          `
        )
        .eq("school_id", student.school_id)
        .is("deleted_at", null)
        .order("created_at", { ascending: true }),
    ]);

  if (locationError && !locationError.message.includes("public.locations")) {
    throw new Error(locationError.message);
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl px-5 py-8">
      <Card className="w-full rounded-lg border-0 bg-white ring-1 ring-sky-100">
        <CardHeader>
          <CardTitle className="text-2xl text-slate-950">
            次回のレッスンを予約
          </CardTitle>
          <CardDescription className="text-slate-600">
            予約可能な時間だけを一覧から選べます。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StudentBookingFlowPage
            studentId={student.user_id}
            teacherId={student.teacher_id}
            schoolId={student.school_id}
            locationManagementEnabled={
              schoolTeacher?.location_management_enabled ?? false
            }
            defaultLocationId={student.default_location_id}
            locations={(locations ?? []).map((location) => ({
              id: location.id,
              name: location.name,
              type: location.type,
              areaName: (Array.isArray(location.area)
                ? location.area[0]
                : location.area)?.name,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
