import Link from "next/link";
import { redirect } from "next/navigation";

import { createLocationAction } from "@/actions/locations";
import { buttonVariants } from "@/components/ui/button";
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
          <CardTitle className="text-2xl">場所を追加</CardTitle>
          <CardDescription>
            {school?.name}で予約に使う場所を登録します。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createLocationAction} className="space-y-6">
            <input type="hidden" name="school_id" value={schoolId} />
            <div className="space-y-2">
              <Label htmlFor="name">場所の名前</Label>
              <Input id="name" name="name" required placeholder="ルーム1" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">タイプ</Label>
              <select
                id="type"
                name="type"
                className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-neutral-400"
                defaultValue="room"
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
                defaultValue=""
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
                className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-400"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className={buttonVariants({ size: "lg" })}
              >
                追加
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
