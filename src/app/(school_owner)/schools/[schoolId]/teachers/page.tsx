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
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            教室詳細へ戻る
          </Link>
          <h1 className="text-3xl font-semibold text-neutral-950">
            {school.name}の講師
          </h1>
        </div>
        <ButtonStub label="講師を招待" />
      </div>

      {typedTeachers.length ? (
        <div className="grid gap-4">
          {typedTeachers.map((teacherLink) => {
            const teacher = extractTeacher(teacherLink);

            return (
              <Card
                key={teacherLink.id}
                className="rounded-lg border-0 bg-white ring-1 ring-neutral-200"
              >
                <CardHeader>
                  <CardTitle className="text-xl text-neutral-950">
                    {teacher.displayName}
                  </CardTitle>
                  <CardDescription>{teacher.email}</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-neutral-600">
                  役割: {teacherLink.role}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="rounded-lg border-0 bg-white ring-1 ring-neutral-200">
          <CardContent className="py-10">
            <EmptyState message="まだ所属講師はいません" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ButtonStub({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="inline-flex h-9 items-center justify-center rounded-lg border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-500"
    >
      {label}
    </button>
  );
}
