import { redirect } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export const dynamic = "force-dynamic";

export default async function SchoolOwnerSettingsPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "school_owner") {
    redirect("/");
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-4xl px-5 py-8">
      <Card className="w-full rounded-lg border-0 bg-white ring-1 ring-neutral-200">
        <CardHeader>
          <CardTitle className="text-2xl text-neutral-950">設定</CardTitle>
          <CardDescription>
            教室オーナー向けの設定画面です。詳細な権限設定や請求管理は後続タスクで追加します。
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm leading-6 text-neutral-600">
          現在は学校管理の基本導線のみ実装されています。
        </CardContent>
      </Card>
    </div>
  );
}
