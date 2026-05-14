import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { removeStudentFromSchoolAction } from "@/actions/students";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
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
  created_at?: string | null;
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
    .is("deleted_at", null)
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
    .select("user_id, teacher_id, created_at")
    .eq("school_id", schoolId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const typedStudents = (students ?? []) as StudentRow[];
  const profileIds = Array.from(
    new Set(
      typedStudents.flatMap((student) => [student.user_id, student.teacher_id])
    )
  );

  const { data: profiles, error: profilesError } = profileIds.length
    ? await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", profileIds)
    : { data: [], error: null };

  if (profilesError) {
    throw new Error(profilesError.message);
  }

  const displayNameById = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile.display_name ?? ""])
  );

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl flex-col gap-6 px-5 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <Link
            href={`/schools/${schoolId}`}
            className={buttonVariants({ variant: "ghost", size: "sm", className: "rounded-xl text-slate-600" })}
          >
            教室詳細へ戻る
          </Link>
          <div className="inline-flex items-center gap-3 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
            <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-emerald-200 text-slate-900">
              生
            </span>
            Students
          </div>
          <h1 className="text-3xl font-semibold text-neutral-950">
            {school.name}の生徒
          </h1>
        </div>
        <Link
          href={`/schools/${schoolId}/invitations/new`}
          className={buttonVariants({ className: "rounded-xl bg-emerald-500 text-white hover:bg-emerald-400 hover:text-white" })}
        >
          生徒を追加
        </Link>
      </div>

      {typedStudents.length ? (
        <div className="grid gap-4">
          {typedStudents.map((student) => (
            <Card
              key={student.user_id}
              className="rounded-[24px] border border-emerald-100/70 bg-white shadow-[0_16px_40px_rgba(15,31,46,0.05)]"
            >
              <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 font-semibold text-emerald-700">
                  {(displayNameById.get(student.user_id) || "生").slice(0, 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-xl text-neutral-950">
                    {displayNameById.get(student.user_id) || "生徒"}
                  </CardTitle>
                  <CardDescription>
                    担当講師: {displayNameById.get(student.teacher_id) || "未設定"}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="flex justify-end pt-0">
                <ConfirmDeleteDialog
                  triggerLabel="削除"
                  title="生徒を削除"
                  description={`「${displayNameById.get(student.user_id) || "この生徒"}」を教室から外しますか?`}
                  action={removeStudentFromSchoolAction}
                  hiddenFields={[
                    { name: "school_id", value: schoolId },
                    { name: "student_id", value: student.user_id },
                  ]}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="rounded-[24px] border border-emerald-100/70 bg-white">
          <CardContent className="py-10">
            <EmptyState message="まだ教室に紐付いた生徒はいません" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
