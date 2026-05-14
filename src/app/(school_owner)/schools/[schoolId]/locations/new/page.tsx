import Link from "next/link";
import { redirect } from "next/navigation";

import { LocationForm } from "@/components/schools/location-form";
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

export default async function NewLocationPage({
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
  const [{ data: school, error }, { data: areas, error: areaError }] =
    await Promise.all([
      supabase
        .from("schools")
        .select("id, name")
        .eq("id", schoolId)
        .eq("owner_id", user.id)
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
            New Location
          </div>
          <CardTitle className="text-2xl">場所を追加</CardTitle>
          <CardDescription>
            {school?.name}で予約に使う場所を登録します。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LocationForm schoolId={schoolId} areas={areas ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}
