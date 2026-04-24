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
import { findReservationForRecording } from "@/lib/reservations/find-current";

export const dynamic = "force-dynamic";

const formatReservationTime = (value: string) =>
  new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

export default async function RecordPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "teacher") {
    redirect("/");
  }

  const reservation = await findReservationForRecording(user.id);

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-4xl flex-col gap-6 px-5 py-8">
      {reservation ? (
        <Card className="rounded-lg border-0 bg-white ring-1 ring-neutral-200">
          <CardHeader>
            <CardTitle className="text-2xl">
              {reservation.student_name}さんのレッスンを録音します
            </CardTitle>
            <CardDescription>
              予約時刻: {formatReservationTime(reservation.scheduled_at)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <RecorderPanel
              studentId={reservation.student_id}
              studentName={reservation.student_name}
              reservationId={reservation.id}
            />
            <div className="flex justify-center">
              <Link
                href="/record/select-student"
                className={buttonVariants({ variant: "ghost" })}
              >
                違う生徒で録音
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-lg border-0 bg-white ring-1 ring-neutral-200">
          <CardHeader>
            <CardTitle className="text-2xl">近い時間の予約がありません</CardTitle>
            <CardDescription>
              予約がない場合は、生徒を手動で選ぶか、その場で予約を作れます。
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <Link href="/record/select-student" className={buttonVariants({ size: "lg" })}>
              生徒を選んで録音
            </Link>
            <Link
              href="/reservations/new"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              予約を作って録音
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
