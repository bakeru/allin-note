import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { deleteAreaAction } from "@/actions/locations";
import { AreaForm } from "@/components/schools/area-form";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
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

export default async function EditAreaPage({
  params,
}: {
  params: Promise<{ schoolId: string; areaId: string }>;
}) {
  const { schoolId, areaId } = await params;
  const user = await getCurrentUser();

  if (!user || user.role !== "school_owner") {
    redirect("/");
  }

  const supabase = createServiceClient();
  const { data: area, error } = await supabase
    .from("areas")
    .select("id, name")
    .eq("id", areaId)
    .eq("school_id", schoolId)
    .is("deleted_at", null)
    .single();

  if (error) throw new Error(error.message);
  if (!area) notFound();

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
            Edit Area
          </div>
          <CardTitle className="text-2xl">エリアを編集</CardTitle>
          <CardDescription>名前だけをシンプルに更新できます。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <AreaForm schoolId={schoolId} areaId={areaId} defaultName={area.name} />

          <div className="flex justify-end">
            <ConfirmDeleteDialog
              triggerLabel="削除"
              title="エリアを削除"
              description={`「${area.name}」を削除しますか?`}
              action={deleteAreaAction}
              hiddenFields={[
                { name: "school_id", value: schoolId },
                { name: "area_id", value: areaId },
              ]}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
