import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { deleteLocationAction } from "@/actions/locations";
import { LocationForm } from "@/components/schools/location-form";
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

export default async function EditLocationPage({
  params,
}: {
  params: Promise<{ schoolId: string; locationId: string }>;
}) {
  const { schoolId, locationId } = await params;
  const user = await getCurrentUser();

  if (!user || user.role !== "school_owner") {
    redirect("/");
  }

  const supabase = createServiceClient();
  const [{ data: location, error }, { data: areas, error: areaError }] =
    await Promise.all([
      supabase
        .from("locations")
        .select("id, name, type, area_id, notes")
        .eq("id", locationId)
        .eq("school_id", schoolId)
        .is("deleted_at", null)
        .single(),
      supabase
        .from("areas")
        .select("id, name")
        .eq("school_id", schoolId)
        .is("deleted_at", null)
        .order("name", { ascending: true }),
    ]);

  if (error) throw new Error(error.message);
  if (areaError && !areaError.message.includes("public.areas")) {
    throw new Error(areaError.message);
  }
  if (!location) notFound();

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
              場
            </span>
            Edit Location
          </div>
          <CardTitle className="text-2xl">場所を編集</CardTitle>
          <CardDescription>名前やタイプ、エリアを調整できます。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <LocationForm
            schoolId={schoolId}
            locationId={locationId}
            areas={areas ?? []}
            defaults={{
              name: location.name,
              type: location.type,
              areaId: location.area_id,
              notes: location.notes,
            }}
          />

          <div className="flex justify-end">
            <ConfirmDeleteDialog
              triggerLabel="削除"
              title="場所を削除"
              description={`「${location.name}」を削除しますか?`}
              action={deleteLocationAction}
              hiddenFields={[
                { name: "school_id", value: schoolId },
                { name: "location_id", value: locationId },
              ]}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
