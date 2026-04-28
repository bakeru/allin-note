import Link from "next/link";
import { notFound, redirect } from "next/navigation";

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

const extractName = (student: StudentRow) => {
  const profile = Array.isArray(student.profile)
    ? student.profile[0]
    : student.profile;

  return profile?.display_name ?? "生徒";
};

export default async function StudentRecordPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const user = await getCurrentUser();

  if (!user || user.role !== "teacher") {
    redirect("/");
  }

  const supabase = createServiceClient();
  const { data: student, error } = await supabase
    .from("students")
    .select(
      `
        user_id,
        profile:profiles!students_user_id_fkey(display_name)
      `
    )
    .eq("teacher_id", user.id)
    .eq("user_id", studentId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (!student) {
    notFound();
  }

  const studentName = extractName(student as StudentRow);

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-4xl flex-col gap-6 px-5 py-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-neutral-950">
            {studentName}さんの録音
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            予約がない場合の手動フォールバックです。
          </p>
        </div>
        <Link href="/record/select-student" className={buttonVariants({ variant: "outline" })}>
          生徒を選び直す
        </Link>
      </div>

      <Card className="rounded-lg border-0 bg-white ring-1 ring-neutral-200">
        <CardHeader>
          <CardTitle>録音準備完了</CardTitle>
          <CardDescription>
            このまま録音を始めると、アップロード後のレッスンはこの生徒に紐付きます。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RecorderPanel studentId={student.user_id} studentName={studentName} />
        </CardContent>
      </Card>
    </div>
  );
}
