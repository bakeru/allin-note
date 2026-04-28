import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { CreateInvitationForm } from "@/components/invitations/create-invitation-form";
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

export default async function NewInvitationPage({
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
  const [{ data: school, error: schoolError }, { data: teachers }, { data: locations }] =
    await Promise.all([
      supabase
        .from("schools")
        .select("id, name")
        .eq("id", schoolId)
        .eq("owner_id", user.id)
        .is("deleted_at", null)
        .single(),
      supabase
        .from("school_teachers")
        .select(
          `
            teacher_id,
            teacher:profiles!school_teachers_teacher_id_fkey(display_name)
          `
        )
        .eq("school_id", schoolId)
        .order("joined_at", { ascending: true }),
      supabase
        .from("locations")
        .select("id, name")
        .eq("school_id", schoolId)
        .is("deleted_at", null)
        .order("created_at", { ascending: true }),
    ]);

  if (schoolError) {
    throw new Error(schoolError.message);
  }

  if (!school) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <Card className="rounded-lg border-0 bg-white ring-1 ring-neutral-200">
        <CardHeader>
          <Link
            href={`/schools/${schoolId}/invitations`}
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            招待一覧へ戻る
          </Link>
          <CardTitle className="text-2xl">新しい招待を作成</CardTitle>
          <CardDescription>
            {school.name}に参加してもらうための招待リンクを発行します。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateInvitationForm
            schoolId={schoolId}
            teachers={(teachers ?? []).map((teacher) => ({
              id: teacher.teacher_id,
              name:
                (Array.isArray(teacher.teacher)
                  ? teacher.teacher[0]
                  : teacher.teacher)?.display_name ?? "講師",
            }))}
            locations={(locations ?? []).map((location) => ({
              id: location.id,
              name: location.name,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
