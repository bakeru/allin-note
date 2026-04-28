import Link from "next/link";
import { redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

type SchoolRow = {
  id: string;
  name: string;
  description?: string | null;
  subscription_plan?: string | null;
};

export default async function SchoolsPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "school_owner") {
    redirect("/");
  }

  const supabase = createServiceClient();
  const { data: schools, error } = await supabase
    .from("schools")
    .select("id, name, description, subscription_plan")
    .eq("owner_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    if (error.message.includes("public.schools")) {
      return (
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col gap-8 px-5 py-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-neutral-950">教室</h1>
            <p className="text-sm leading-6 text-neutral-600">
              教室管理機能を使う前に、追加マイグレーションを実行してください。
            </p>
          </div>
          <Card className="rounded-lg border-0 bg-white ring-1 ring-neutral-200">
            <CardContent className="py-8">
              <EmptyState message="`supabase/migrations/20260427020000_add_schools.sql` を Supabase SQL Editor で実行すると、この画面が使えるようになります。" />
            </CardContent>
          </Card>
        </div>
      );
    }

    throw new Error(error.message);
  }

  const typedSchools = (schools ?? []) as SchoolRow[];
  const schoolIds = typedSchools.map((school) => school.id);
  const countsBySchool = new Map<
    string,
    { teacherCount: number; studentCount: number }
  >();

  await Promise.all(
    schoolIds.map(async (schoolId) => {
      const [{ count: teacherCount }, { count: studentCount }] = await Promise.all([
        supabase
          .from("school_teachers")
          .select("*", { count: "exact", head: true })
          .eq("school_id", schoolId),
        supabase
          .from("students")
          .select("*", { count: "exact", head: true })
          .eq("school_id", schoolId)
          .is("deleted_at", null),
      ]);

      countsBySchool.set(schoolId, {
        teacherCount: teacherCount ?? 0,
        studentCount: studentCount ?? 0,
      });
    })
  );

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col gap-8 px-5 py-8">
      {typedSchools.length ? (
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold text-neutral-950">教室</h1>
              <p className="text-sm leading-6 text-neutral-600">
                契約中の教室をここから管理します。将来的な複数教室にも対応できる形です。
              </p>
            </div>
            <Link href="/schools/new" className={buttonVariants({ size: "lg" })}>
              新しい教室を追加
            </Link>
          </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {typedSchools.map((school) => {
            const counts = countsBySchool.get(school.id) ?? {
              teacherCount: 0,
              studentCount: 0,
            };

            return (
              <Card
                key={school.id}
                className="rounded-lg border-0 bg-white ring-1 ring-neutral-200"
              >
                <CardHeader>
                  <CardTitle className="text-xl text-neutral-950">
                    {school.name}
                  </CardTitle>
                  <CardDescription>
                    {school.description?.trim() || "説明はまだありません"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm text-neutral-600">
                    <div className="rounded-lg bg-neutral-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-wide text-neutral-400">
                        生徒数
                      </p>
                      <p className="mt-1 text-lg font-semibold text-neutral-950">
                        {counts.studentCount}人
                      </p>
                    </div>
                    <div className="rounded-lg bg-neutral-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-wide text-neutral-400">
                        講師数
                      </p>
                      <p className="mt-1 text-lg font-semibold text-neutral-950">
                        {counts.teacherCount}人
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-neutral-500">
                      プラン: {school.subscription_plan ?? "light"}
                    </p>
                    <Link
                      href={`/schools/${school.id}`}
                      className={buttonVariants({ variant: "outline" })}
                    >
                      詳細を見る
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        </>
      ) : (
        <Card className="rounded-lg border-0 bg-white ring-1 ring-emerald-200 shadow-sm">
          <CardContent className="flex flex-col items-center gap-6 px-6 py-14 text-center sm:px-10">
            <div className="space-y-3">
              <p className="text-sm font-medium tracking-wide text-emerald-700">
                AllIn Note へようこそ
              </p>
              <h1 className="text-3xl font-semibold text-neutral-950">
                {user.display_name}さん、まずは最初の教室を作成しましょう。
              </h1>
              <p className="mx-auto max-w-2xl text-sm leading-7 text-neutral-600 sm:text-base">
                教室を作成すると、生徒や講師の管理、予約の受付、
                レッスンノートの記録を始められます。
              </p>
            </div>
            <Link
              href="/schools/new"
              className={buttonVariants({
                size: "lg",
                className: "min-w-56 bg-emerald-600 text-white hover:bg-emerald-500",
              })}
            >
              最初の教室を作成する
            </Link>
            <EmptyState message="教室はまだ登録されていません。" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
