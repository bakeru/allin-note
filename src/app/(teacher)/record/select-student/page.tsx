import Link from "next/link";
import { redirect } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { createServiceClient } from "@/lib/supabase/service";
import { buttonVariants } from "@/components/ui/button";

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

export default async function SelectStudentPage() {
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
        profile:profiles!user_id(display_name)
      `
    )
    .eq("teacher_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl flex-col gap-6 px-5 py-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-neutral-950">生徒を選んで録音</h1>
        <p className="text-sm text-neutral-600">
          予約がないときは、ここから録音相手を選べます。
        </p>
      </div>

      {students?.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {students.map((student) => (
            <Link key={student.user_id} href={`/record/student/${student.user_id}`}>
              <Card className="rounded-lg border-0 bg-white transition hover:bg-neutral-50 hover:ring-neutral-300">
                <CardHeader>
                  <CardTitle className="text-xl">{extractName(student as StudentRow)}さん</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-neutral-600">
                  この生徒で録音を開始します。
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="rounded-lg border-0 bg-white ring-1 ring-neutral-200">
          <CardContent className="py-8 text-sm text-neutral-600">
            まだ担当生徒がいません。先にSupabaseで `students` レコードを作成してください。
          </CardContent>
        </Card>
      )}

      <div>
        <Link href="/reservations/new" className={buttonVariants({ variant: "outline" })}>
          予約を作って録音
        </Link>
      </div>
    </div>
  );
}
