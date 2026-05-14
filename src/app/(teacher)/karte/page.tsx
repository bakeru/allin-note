import { FileText, Mic, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTeacherWorkspaceUser } from "@/lib/auth/teacher-access";
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

export default async function TeacherKartePage() {
  const user = await getTeacherWorkspaceUser();

  if (!user) {
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
    <div className="mx-auto min-h-screen w-full max-w-4xl px-5 py-6 md:py-8">
      <div className="mb-5 md:mb-8">
        <p className="text-[11px] font-semibold tracking-[0.22em] text-[#1D9E75]">
          KARTE
        </p>
        <h1 className="mt-2 text-[2rem] font-semibold tracking-tight text-slate-900 md:text-3xl">
          カルテ
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          生徒ごとの記録は次フェーズで深掘りします。今は担当生徒の一覧を確認できます。
        </p>
      </div>

      <Card className="mb-5 rounded-[24px] border border-[#d9eee6] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
        <CardContent className="flex items-center gap-4 p-5">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E1F5EE] text-[#1D9E75]">
            <Users className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">担当生徒</p>
            <p className="mt-1 text-sm text-slate-500">
              {(students ?? []).length}人の生徒が登録されています。
            </p>
          </div>
        </CardContent>
      </Card>

      {(students ?? []).length ? (
        <div className="space-y-3">
          {(students ?? []).map((student) => (
            <div
              key={student.user_id}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-[0_8px_20px_rgba(15,23,42,0.03)]"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {extractName(student as StudentRow)}さん
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    個別カルテの詳細ビューは次フェーズで追加予定です。
                  </p>
                </div>
                <Link
                  href={`/record/student/${student.user_id}`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  <Mic className="mr-1 h-4 w-4" />
                  録音へ
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card className="rounded-[24px] border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-[#1D9E75]" />
              まだ担当生徒がいません
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-slate-500">
            <p>生徒が紐付くと、ここからカルテの入口に進めます。</p>
            <Link href="/record/select-student" className={buttonVariants({ variant: "outline" })}>
              生徒を選んで録音する
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
