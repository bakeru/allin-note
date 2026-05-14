import { Building2, Settings2, UserRound } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LogoutForm } from "@/components/auth/logout-form";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTeacherWorkspaceUser } from "@/lib/auth/teacher-access";

export const dynamic = "force-dynamic";

export default async function TeacherMyPage() {
  const user = await getTeacherWorkspaceUser();

  if (!user) {
    redirect("/");
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-4xl px-5 py-6 md:py-8">
      <div className="mb-5 md:mb-8">
        <p className="text-[11px] font-semibold tracking-[0.22em] text-[#1D9E75]">
          MY PAGE
        </p>
        <h1 className="mt-2 text-[2rem] font-semibold tracking-tight text-slate-900 md:text-3xl">
          マイページ
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          プロフィールと講師ワークスペースの設定をここから確認できます。
        </p>
      </div>

      <Card className="mb-5 rounded-[24px] border border-[#d9eee6] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
        <CardContent className="flex items-center gap-4 p-5">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#E1F5EE] text-xl font-bold text-[#1D9E75]">
            {user.display_name.slice(0, 1)}
          </span>
          <div>
            <p className="text-xl font-semibold text-slate-900">{user.display_name}</p>
            <p className="mt-1 text-sm text-slate-500">
              {user.role === "school_owner" ? "教室オーナー / 講師" : "講師"}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <Link
          href="/dashboard"
          className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-[0_8px_20px_rgba(15,23,42,0.03)] transition hover:border-[#9FE1CB] hover:bg-[#fbfefd]"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E1F5EE] text-[#1D9E75]">
              <UserRound className="h-4 w-4" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-slate-900">
                ホームに戻る
              </span>
              <span className="block text-xs text-slate-500">
                今日のレッスンと送信待ちを確認します。
              </span>
            </span>
          </span>
        </Link>

        <Link
          href="/reservations"
          className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-[0_8px_20px_rgba(15,23,42,0.03)] transition hover:border-[#9FE1CB] hover:bg-[#fbfefd]"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E1F5EE] text-[#1D9E75]">
              <Settings2 className="h-4 w-4" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-slate-900">
                予約を確認する
              </span>
              <span className="block text-xs text-slate-500">
                今後の予定や編集導線に進めます。
              </span>
            </span>
          </span>
        </Link>

        {user.role === "school_owner" ? (
          <Link
            href="/schools"
            className={buttonVariants({
              variant: "outline",
              className:
                "flex h-auto w-full items-center justify-start gap-3 rounded-2xl border-[#9FE1CB] bg-[#E1F5EE] px-4 py-3.5 text-left text-[#0F6E56] hover:bg-[#d5f1e7] hover:text-[#04342C]",
            })}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#1D9E75]">
              <Building2 className="h-4 w-4" />
            </span>
            <span>
              <span className="block text-sm font-semibold">教室画面に戻る</span>
              <span className="block text-xs text-[#0F6E56]/80">
                オーナーモードの設定や管理画面へ切り替えます。
              </span>
            </span>
          </Link>
        ) : null}
      </div>

      <Card className="mt-5 rounded-[24px] border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
        <CardHeader>
          <CardTitle className="text-lg">ログアウト</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm text-slate-500">
          <p>別のアカウントに切り替える場合はこちらからログアウトできます。</p>
          <div className="flex justify-start">
            <LogoutForm className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-slate-700 hover:bg-slate-100" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
