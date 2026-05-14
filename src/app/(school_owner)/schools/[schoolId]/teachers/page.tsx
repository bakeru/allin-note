import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { removeTeacherMembershipAction } from "@/actions/schools";
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

type TeacherLinkRow = {
  id: string;
  role: string;
  teacher?:
    | {
        display_name?: string | null;
        email?: string | null;
      }
    | Array<{
        display_name?: string | null;
        email?: string | null;
      }>
    | null;
};

const extractTeacher = (row: TeacherLinkRow) => {
  const teacher = Array.isArray(row.teacher) ? row.teacher[0] : row.teacher;

  return {
    displayName: teacher?.display_name ?? "講師",
    email: teacher?.email ?? "",
  };
};

export default async function SchoolTeachersPage({
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

  const { data: teachers, error } = await supabase
    .from("school_teachers")
    .select(
      `
        id,
        role,
        teacher:profiles!school_teachers_teacher_id_fkey(
          display_name,
          email
        )
      `
    )
    .eq("school_id", schoolId)
    .order("joined_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const typedTeachers = (teachers ?? []) as TeacherLinkRow[];

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
              講
            </span>
            Teachers
          </div>
          <h1 className="text-3xl font-semibold text-neutral-950">
            {school.name}の講師
          </h1>
        </div>
        <Link
          href={`/schools/${schoolId}/invitations/new`}
          className={buttonVariants({ className: "rounded-xl bg-emerald-500 text-white hover:bg-emerald-400 hover:text-white" })}
        >
          講師を招待
        </Link>
      </div>

      {typedTeachers.length ? (
        <div className="grid gap-4">
          {typedTeachers.map((teacherLink) => {
            const teacher = extractTeacher(teacherLink);

            return (
              <Card
                key={teacherLink.id}
                className="rounded-[24px] border border-emerald-100/70 bg-white shadow-[0_16px_40px_rgba(15,31,46,0.05)]"
              >
                <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 font-semibold text-emerald-700">
                    {teacher.displayName.slice(0, 1)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-xl text-neutral-950">
                      {teacher.displayName}
                    </CardTitle>
                    <CardDescription>{teacher.email}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center justify-between text-sm text-neutral-600">
                  <span>役割: {teacherLink.role}</span>
                  <ConfirmDeleteDialog
                    triggerLabel="所属を削除"
                    title="講師の所属を削除"
                    description={`「${teacher.displayName}」の所属をこの教室から外しますか?`}
                    action={removeTeacherMembershipAction}
                    hiddenFields={[
                      { name: "school_id", value: schoolId },
                      { name: "membership_id", value: teacherLink.id },
                    ]}
                    confirmLabel="所属を削除"
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="rounded-[24px] border border-emerald-100/70 bg-white">
          <CardContent className="py-10">
            <EmptyState message="まだ所属講師はいません" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
