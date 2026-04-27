import { redirect } from "next/navigation";

import { createSchoolFormAction } from "@/actions/schools";
import { Button } from "@/components/ui/button";
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

export const dynamic = "force-dynamic";

export default async function NewSchoolPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "school_owner") {
    redirect("/");
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl px-5 py-8">
      <Card className="w-full rounded-lg border-0 bg-white ring-1 ring-neutral-200">
        <CardHeader>
          <CardTitle className="text-2xl text-neutral-950">
            新しい教室を追加
          </CardTitle>
          <CardDescription>
            教室名と説明を登録して、運用の土台を作ります。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createSchoolFormAction} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">教室名</Label>
              <Input id="name" name="name" required className="h-10" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">説明</Label>
              <textarea
                id="description"
                name="description"
                rows={4}
                className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-400"
                placeholder="教室の特徴や補足があれば入力します。"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subscription_plan">初期プラン</Label>
              <select
                id="subscription_plan"
                name="subscription_plan"
                defaultValue="light"
                className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-neutral-400"
                disabled
              >
                {["light", "standard", "plus", "pro", "business", "enterprise"].map(
                  (plan) => (
                    <option key={plan} value={plan}>
                      {plan}
                    </option>
                  )
                )}
              </select>
              <p className="text-xs text-neutral-500">
                今回は初期値の `light` で作成します。課金連携は後続タスクで追加します。
              </p>
            </div>

            <label className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
              <input
                type="checkbox"
                name="also_be_a_teacher"
                defaultChecked
                className="mt-0.5 size-4 rounded border-neutral-300"
              />
              <span>自分自身をこの教室の講師としても登録する</span>
            </label>

            <div className="flex justify-end">
              <Button type="submit" size="lg">
                教室を作成
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
