import Link from "next/link";
import { notFound, redirect } from "next/navigation";

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

type SchoolRow = {
  id: string;
  name: string;
  description?: string | null;
  subscription_plan?: string | null;
  subscription_status?: string | null;
};

export default async function SchoolDetailPage({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const { schoolId } = await params;
  const user = await getCurrentUser();

  if (!user || user.role !== "school_owner") {
    redirect("/");
  }

  const supabase = createServiceClient();
  const { data: school, error } = await supabase
    .from("schools")
    .select("*")
    .eq("id", schoolId)
    .eq("owner_id", user.id)
    .single();

  if (error) {
    if (error.message.includes("public.schools")) {
      redirect("/schools");
    }

    throw new Error(error.message);
  }

  if (!school) {
    notFound();
  }

  const [{ count: studentCount }, { count: teacherCount }, { data: students }] =
    await Promise.all([
      supabase
        .from("students")
        .select("*", { count: "exact", head: true })
        .eq("school_id", schoolId),
      supabase
        .from("school_teachers")
        .select("*", { count: "exact", head: true })
        .eq("school_id", schoolId),
      supabase.from("students").select("user_id").eq("school_id", schoolId),
    ]);

  const studentIds = students?.map((student) => student.user_id) ?? [];
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count: lessonCount } = studentIds.length
    ? await supabase
        .from("lessons")
        .select("*", { count: "exact", head: true })
        .in("student_id", studentIds)
        .gte("recorded_at", startOfMonth.toISOString())
    : { count: 0 };

  const typedSchool = school as SchoolRow;

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col gap-8 px-5 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Link
            href="/schools"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            教室一覧へ戻る
          </Link>
          <h1 className="text-3xl font-semibold text-neutral-950">
            {typedSchool.name}
          </h1>
          <p className="text-sm leading-6 text-neutral-600">
            {typedSchool.description?.trim() || "教室の説明はまだありません。"}
          </p>
        </div>
        <div className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-800">
          {typedSchool.subscription_plan ?? "light"} /{" "}
          {typedSchool.subscription_status ?? "active"}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "生徒数", value: `${studentCount ?? 0}人` },
          { label: "講師数", value: `${teacherCount ?? 0}人` },
          { label: "今月のレッスン数", value: `${lessonCount ?? 0}件` },
        ].map((stat) => (
          <Card
            key={stat.label}
            className="rounded-lg border-0 bg-white ring-1 ring-neutral-200"
          >
            <CardHeader>
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle className="text-3xl text-neutral-950">
                {stat.value}
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-lg border-0 bg-white ring-1 ring-neutral-200">
          <CardHeader>
            <CardTitle className="text-xl text-neutral-950">講師</CardTitle>
            <CardDescription>
              教室に所属している講師の一覧を確認します。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href={`/schools/${schoolId}/teachers`}
              className={buttonVariants({ variant: "outline" })}
            >
              講師一覧を見る
            </Link>
          </CardContent>
        </Card>

        <Card className="rounded-lg border-0 bg-white ring-1 ring-neutral-200">
          <CardHeader>
            <CardTitle className="text-xl text-neutral-950">生徒</CardTitle>
            <CardDescription>
              生徒一覧と担当講師の紐付きを確認します。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href={`/schools/${schoolId}/students`}
              className={buttonVariants({ variant: "outline" })}
            >
              生徒一覧を見る
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
