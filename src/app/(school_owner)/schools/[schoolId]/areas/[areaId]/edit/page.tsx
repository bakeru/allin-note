import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { deleteAreaAction, updateAreaAction } from "@/actions/locations";
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
    .single();

  if (error) throw new Error(error.message);
  if (!area) notFound();

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
          <CardTitle className="text-2xl">エリアを編集</CardTitle>
          <CardDescription>名前だけをシンプルに更新できます。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form action={updateAreaAction} className="space-y-6">
            <input type="hidden" name="school_id" value={schoolId} />
            <input type="hidden" name="area_id" value={areaId} />
            <div className="space-y-2">
              <Label htmlFor="name">エリア名</Label>
              <Input id="name" name="name" required defaultValue={area.name} />
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

          <form action={deleteAreaAction} className="flex justify-end">
            <input type="hidden" name="school_id" value={schoolId} />
            <input type="hidden" name="area_id" value={areaId} />
            <Button type="submit" variant="ghost" className="text-neutral-500">
              削除
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
