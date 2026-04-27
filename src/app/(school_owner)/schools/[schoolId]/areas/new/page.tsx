import Link from "next/link";
import { redirect } from "next/navigation";

import { createAreaAction } from "@/actions/locations";
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
    .single();

  if (error) throw new Error(error.message);

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
          <CardTitle className="text-2xl">エリアを追加</CardTitle>
          <CardDescription>
            {school?.name}で使う移動エリアを登録します。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createAreaAction} className="space-y-6">
            <input type="hidden" name="school_id" value={schoolId} />
            <div className="space-y-2">
              <Label htmlFor="name">エリア名</Label>
              <Input id="name" name="name" required placeholder="新宿エリア" />
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
