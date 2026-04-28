import Link from "next/link";
import { redirect } from "next/navigation";

import { RecorderPanel } from "@/components/recording/recorder-panel";
import { buttonVariants } from "@/components/ui/button";
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

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type ReservationRow = {
  id: string;
  student_id: string;
  duration_minutes: number | null;
  scheduled_at: string;
  student:
    | {
        profile:
          | {
              display_name: string;
            }
          | Array<{
              display_name: string;
            }>
          | null;
      }
    | Array<{
        profile:
          | {
              display_name: string;
            }
          | Array<{
              display_name: string;
            }>
          | null;
      }>
    | null;
};

const extractStudentName = (reservation: ReservationRow) => {
  const student = Array.isArray(reservation.student)
    ? reservation.student[0]
    : reservation.student;
  const profile = Array.isArray(student?.profile)
    ? student.profile[0]
    : student?.profile;

  return profile?.display_name ?? "生徒";
};

const formatReservationTime = (value: string) =>
  new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

export default async function StartReservationRecordingPage({
  params,
}: {
  params: Promise<{ reservationId: string }>;
}) {
  const { reservationId } = await params;
  const user = await getCurrentUser();

  if (!user || user.role !== "teacher") {
    redirect("/");
  }

  if (!UUID_PATTERN.test(reservationId)) {
    redirect("/record");
  }

  const supabase = createServiceClient();
  const { data: reservation, error } = await supabase
    .from("reservations")
    .select(
      `
        id,
        student_id,
        duration_minutes,
        scheduled_at,
        student:students!inner(
          profile:profiles!students_user_id_fkey(display_name)
        )
      `
    )
    .eq("id", reservationId)
    .eq("teacher_id", user.id)
    .single();

  if (error) {
    if (error.message.includes("public.reservations")) {
      redirect("/record");
    }

    throw new Error(error.message);
  }

  if (!reservation) {
    redirect("/record");
  }

  const typedReservation = reservation as ReservationRow;
  const studentName = extractStudentName(typedReservation);

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-4xl flex-col gap-6 px-5 py-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-neutral-950">
            {studentName}さんのレッスンを録音します
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            予約時刻: {formatReservationTime(typedReservation.scheduled_at)}
          </p>
        </div>
        <Link href="/record" className={buttonVariants({ variant: "outline" })}>
          今日の予約へ戻る
        </Link>
      </div>

      <Card className="rounded-lg border-0 bg-white ring-1 ring-neutral-200">
        <CardHeader>
          <CardTitle>録音準備完了</CardTitle>
          <CardDescription>
            この録音は予約に紐付き、完了後に該当予約は録音済みになります。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RecorderPanel
            studentId={typedReservation.student_id}
            studentName={studentName}
            reservationId={typedReservation.id}
          />
        </CardContent>
      </Card>
    </div>
  );
}
