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
import { EmptyState } from "@/components/shared/empty-state";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

type StudentRow = {
  user_id: string;
  teacher_id: string;
  profile?:
    | {
        display_name?: string | null;
      }
    | Array<{
        display_name?: string | null;
      }>
    | null;
  teacher?:
    | {
        display_name?: string | null;
      }
    | Array<{
        display_name?: string | null;
      }>
    | null;
};

const extractDisplayName = (
  value:
    | {
        display_name?: string | null;
      }
    | Array<{
        display_name?: string | null;
      }>
    | null
    | undefined
) => {
  const record = Array.isArray(value) ? value[0] : value;
  return record?.display_name ?? "";
};

export default async function SchoolStudentsPage({
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
  const { data: school, error: schoolError } = await supabase
    .from("schools")
    .select("id, name")
    .eq("id", schoolId)
    .eq("owner_id", user.id)
    .single();

  if (schoolError) {
    if (schoolError.message.includes("public.schools")) {
      redirect("/schools");
    }

    throw new Error(schoolError.message);
  }

  if (!school) {
    notFound();
  }

  const { data: students, error } = await supabase
    .from("students")
    .select(
      `
        user_id,
        teacher_id,
        profile:profiles!students_user_id_fkey(display_name),
        teacher:profiles!students_teacher_id_fkey(display_name)
      `
    )
    .eq("school_id", schoolId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const typedStudents = (students ?? []) as StudentRow[];

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl flex-col gap-6 px-5 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <Link
            href={`/schools/${schoolId}`}
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            教室詳細へ戻る
          </Link>
          <h1 className="text-3xl font-semibold text-neutral-950">
            {school.name}の生徒
          </h1>
        </div>
        <Link
          href={`/schools/${schoolId}/invitations/new`}
          className={buttonVariants({ variant: "outline" })}
        >
          生徒を追加
        </Link>
      </div>

      {typedStudents.length ? (
        <div className="grid gap-4">
          {typedStudents.map((student) => (
            <Card
              key={student.user_id}
              className="rounded-lg border-0 bg-white ring-1 ring-neutral-200"
            >
              <CardHeader>
                <CardTitle className="text-xl text-neutral-950">
                  {extractDisplayName(student.profile) || "生徒"}
                </CardTitle>
                <CardDescription>
                  担当講師: {extractDisplayName(student.teacher) || "未設定"}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="rounded-lg border-0 bg-white ring-1 ring-neutral-200">
          <CardContent className="py-10">
            <EmptyState message="まだ教室に紐付いた生徒はいません" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
