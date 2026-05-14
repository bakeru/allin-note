import Link from "next/link";
import { redirect } from "next/navigation";

import { AreaForm } from "@/components/schools/area-form";
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

export default async function NewAreaPage({
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
    .select("id, name")
    .eq("id", schoolId)
    .eq("owner_id", user.id)
    .is("deleted_at", null)
    .single();

  if (error) throw new Error(error.message);

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <Card className="rounded-[28px] border border-emerald-100/70 bg-white shadow-[0_20px_60px_rgba(15,31,46,0.06)]">
        <CardHeader className="space-y-4">
          <Link
            href={`/schools/${schoolId}`}
            className={buttonVariants({ variant: "ghost", size: "sm", className: "w-fit rounded-xl text-slate-600" })}
          >
            教室詳細へ戻る
          </Link>
          <div className="inline-flex w-fit items-center gap-3 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
            <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-emerald-200 text-slate-900">
              区
            </span>
            New Area
          </div>
          <CardTitle className="text-2xl">エリアを追加</CardTitle>
          <CardDescription>
            {school?.name}で使う移動エリアを登録します。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AreaForm schoolId={schoolId} />
        </CardContent>
      </Card>
    </div>
  );
}
