import { redirect } from "next/navigation";

import { createReservationAction } from "@/actions/reservations";
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

const toDatetimeLocalValue = (value: Date) => {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  const hours = `${value.getHours()}`.padStart(2, "0");
  const minutes = `${value.getMinutes()}`.padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const extractName = (student: StudentRow) => {
  const profile = Array.isArray(student.profile)
    ? student.profile[0]
    : student.profile;

  return profile?.display_name ?? "生徒";
};

export default async function NewReservationPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "teacher") {
    redirect("/");
  }

  const supabase = createServiceClient();
  const { data: students, error } = await supabase
    .from("students")
    .select(
      `
        user_id,
        profile:profiles!inner(display_name)
      `
    )
    .eq("teacher_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

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
          <form action={createReservationAction} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="student_id">生徒</Label>
              <select
                id="student_id"
                name="student_id"
                required
                className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-neutral-400"
                defaultValue={students?.[0]?.user_id ?? ""}
              >
                {students?.map((student) => (
                  <option key={student.user_id} value={student.user_id}>
                    {extractName(student as StudentRow)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduled_at">日時</Label>
              <Input
                id="scheduled_at"
                name="scheduled_at"
                type="datetime-local"
                required
                defaultValue={toDatetimeLocalValue(
                  new Date(Date.now() + 5 * 60 * 1000)
                )}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration_minutes">所要時間</Label>
              <select
                id="duration_minutes"
                name="duration_minutes"
                defaultValue="60"
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
                className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-400"
                placeholder="補足があれば残しておきます。"
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" size="lg">
                予約を追加
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
