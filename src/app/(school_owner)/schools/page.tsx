import Link from "next/link";
import { Plus, School } from "lucide-react";
import { redirect } from "next/navigation";

import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { createServiceClient } from "@/lib/supabase/service";
import { cn } from "@/lib/utils";

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
        <div className="min-h-[700px] px-8 py-8">
          <div className="mb-8 border-b border-emerald-50 pb-6">
            <h1 className="text-[2rem] font-extrabold tracking-tight text-slate-800">
              教室
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              教室管理機能を使う前に、追加マイグレーションを実行してください。
            </p>
          </div>
          <div className="rounded-[24px] border border-emerald-100 bg-white px-8 py-12 shadow-[0_14px_30px_rgba(31,41,55,0.04)]">
            <EmptyState message="`supabase/migrations/20260427020000_add_schools.sql` を Supabase SQL Editor で実行すると、この画面が使えるようになります。" />
          </div>
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
      const [{ count: teacherCount }, { count: studentCount }] =
        await Promise.all([
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

  if (!typedSchools.length) {
    return (
      <div className="min-h-[700px] px-8 py-8">
        <div className="rounded-[28px] border border-emerald-100 bg-white px-10 py-16 text-center shadow-[0_18px_40px_rgba(31,41,55,0.05)]">
          <p className="text-sm font-semibold tracking-[0.18em] text-emerald-600">
            ALLIN NOTE
          </p>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-800">
            {user.display_name}さん、最初の教室を作成しましょう。
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-slate-500">
            教室を作成すると、生徒や講師の管理、予約、レッスンノートの運用を始められます。
          </p>
          <Link
            href="/schools/new"
            className={buttonVariants({
              size: "lg",
              className:
                "mt-8 rounded-2xl bg-[#2bb57f] px-8 text-white hover:bg-[#25a774]",
            })}
          >
            <Plus className="mr-2 h-4 w-4" />
            最初の教室を作成する
          </Link>
          <div className="mt-8">
            <EmptyState message="教室はまだ登録されていません。" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[700px] px-8 py-8">
      <div className="mb-8 flex flex-col gap-5 border-b border-emerald-50 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-[2rem] font-extrabold tracking-tight text-slate-800">
            教室
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-500">
            契約中の教室をここから管理します。複数の教室にも対応しています。
          </p>
        </div>
        <Link
          href="/schools/new"
          className={buttonVariants({
            size: "lg",
            className:
              "rounded-2xl bg-[#2bb57f] px-7 text-white hover:bg-[#25a774]",
          })}
        >
          <Plus className="mr-2 h-4 w-4" />
          新しい教室を追加
        </Link>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {typedSchools.map((school) => {
          const counts = countsBySchool.get(school.id) ?? {
            teacherCount: 0,
            studentCount: 0,
          };

          return (
            <Link
              key={school.id}
              href={`/schools/${school.id}`}
              className="group rounded-[22px] border border-[#e8f0ed] bg-white px-6 py-6 shadow-[0_14px_30px_rgba(31,41,55,0.04)] transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_18px_36px_rgba(31,41,55,0.06)]"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-[54px] w-[54px] items-center justify-center rounded-2xl bg-gradient-to-br from-[#bcefd4] via-[#a4e6c4] to-[#7fddb0] text-[#27463a] shadow-[0_10px_24px_rgba(127,221,176,0.28)]">
                  <School className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-4xl font-extrabold tracking-tight text-slate-800">
                        {school.name}
                      </h2>
                      <p className="mt-1 text-sm text-slate-400">
                        {school.description?.trim() || "説明はまだありません"}
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-4 py-1 text-xs font-bold tracking-[0.05em] text-emerald-600">
                      • {school.subscription_plan ?? "Light"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3 rounded-2xl bg-[#f3fbf6] px-5 py-4">
                {[
                  { label: "生徒", value: `${counts.studentCount}`, unit: "人" },
                  { label: "講師", value: `${counts.teacherCount}`, unit: "人" },
                  { label: "今月", value: "0", unit: "件" },
                ].map((item) => (
                  <div key={item.label} className="text-center">
                    <p className="text-xs font-semibold text-slate-500">
                      {item.label}
                    </p>
                    <p className="mt-2 text-[2rem] font-extrabold tracking-tight text-slate-700">
                      {item.value}
                      <span className="ml-1 text-sm font-semibold text-slate-400">
                        {item.unit}
                      </span>
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5">
                <p className="text-sm text-slate-400">作成日: 2026.04.15</p>
                <span className="font-semibold text-emerald-600 transition group-hover:translate-x-1">
                  詳細を見る →
                </span>
              </div>
            </Link>
          );
        })}

        <Link
          href="/schools/new"
          className={cn(
            "flex min-h-[286px] flex-col items-center justify-center rounded-[22px] border-2 border-dashed border-[#dfe9e4] bg-transparent text-center text-slate-500 transition hover:border-emerald-200 hover:bg-[#f5fbf8] hover:text-emerald-700"
          )}
        >
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500">
            <Plus className="h-6 w-6" />
          </span>
          <span className="text-sm font-semibold">新しい教室を追加</span>
        </Link>
      </div>
    </div>
  );
}
