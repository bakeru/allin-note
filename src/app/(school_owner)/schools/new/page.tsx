import Link from "next/link";
import { redirect } from "next/navigation";

import { CreateSchoolForm } from "@/components/schools/create-school-form";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export const dynamic = "force-dynamic";

export default async function NewSchoolPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "school_owner") {
    redirect("/");
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl px-5 py-8">
      <Card className="w-full rounded-[28px] border border-emerald-100/70 bg-white shadow-[0_20px_60px_rgba(15,31,46,0.06)]">
        <CardHeader className="space-y-4">
          <Link
            href="/schools"
            className={buttonVariants({
              variant: "ghost",
              size: "sm",
              className: "w-fit rounded-xl text-slate-600",
            })}
          >
            教室一覧へ戻る
          </Link>
          <div className="inline-flex w-fit items-center gap-3 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
            <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-emerald-200 text-slate-900">
              +
            </span>
            New School
          </div>
          <CardTitle className="text-2xl text-neutral-950">
            新しい教室を追加
          </CardTitle>
          <CardDescription>
            教室名と説明を登録して、運用の土台を作ります。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateSchoolForm />
        </CardContent>
      </Card>
    </div>
  );
}
