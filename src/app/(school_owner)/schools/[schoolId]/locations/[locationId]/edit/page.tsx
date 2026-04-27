import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { deleteLocationAction, updateLocationAction } from "@/actions/locations";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
        .single(),
      supabase
        .from("areas")
        .select("id, name")
        .eq("school_id", schoolId)
        .order("name", { ascending: true }),
    ]);

  if (error) throw new Error(error.message);
  if (areaError && !areaError.message.includes("public.areas")) {
    throw new Error(areaError.message);
  }
  if (!location) notFound();

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <Card className="rounded-lg border-0 bg-white ring-1 ring-neutral-200">
        <CardHeader>
          <Link
            href={`/schools/${schoolId}`}
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            教室詳細へ戻る
          </Link>
          <CardTitle className="text-2xl">場所を編集</CardTitle>
          <CardDescription>名前やタイプ、エリアを調整できます。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form action={updateLocationAction} className="space-y-6">
            <input type="hidden" name="school_id" value={schoolId} />
            <input type="hidden" name="location_id" value={locationId} />
            <div className="space-y-2">
              <Label htmlFor="name">場所の名前</Label>
              <Input id="name" name="name" required defaultValue={location.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">タイプ</Label>
              <select
                id="type"
                name="type"
                className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-neutral-400"
                defaultValue={location.type}
              >
                <option value="room">教室内ルーム</option>
                <option value="home_visit">出張(生徒宅)</option>
                <option value="external">その他外部施設</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="area_id">エリア</Label>
              <select
                id="area_id"
                name="area_id"
                className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-neutral-400"
                defaultValue={location.area_id ?? ""}
              >
                <option value="">未設定</option>
                {(areas ?? []).map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">メモ</Label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                defaultValue={location.notes ?? ""}
                className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-400"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className={buttonVariants({ size: "lg" })}
              >
                更新
              </button>
            </div>
          </form>

          <form action={deleteLocationAction} className="flex justify-end">
            <input type="hidden" name="school_id" value={schoolId} />
            <input type="hidden" name="location_id" value={locationId} />
            <Button type="submit" variant="ghost" className="text-neutral-500">
              削除
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
