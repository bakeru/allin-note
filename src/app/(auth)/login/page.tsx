import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getHomePathForRole } from "@/lib/auth/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ invite?: string }>;
}) {
  const user = await getCurrentUser();

  if (user) {
    redirect(getHomePathForRole(user.role));
  }

  const resolvedSearchParams = await searchParams;
  const inviteToken = resolvedSearchParams?.invite;
  const redirectTo =
    typeof inviteToken === "string" && inviteToken
      ? `/invite/${inviteToken}`
      : "";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(168,232,200,0.28),_transparent_40%),linear-gradient(180deg,_#f8fcfa_0%,_#eef7f2_100%)] px-6 py-10">
      <Card className="w-full max-w-md rounded-[28px] border border-emerald-100/70 bg-white/95 shadow-[0_20px_60px_rgba(15,31,46,0.08)] backdrop-blur">
        <CardHeader>
          <div className="mb-3 inline-flex w-fit items-center gap-3 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
            <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-emerald-200 text-slate-900">
              AI
            </span>
            AllIn Note
          </div>
          <CardTitle className="text-2xl text-slate-950">ログイン</CardTitle>
          <CardDescription>
            既存のアカウントでAllIn Noteに入ります。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm redirectTo={redirectTo} />
          <div className="mt-6 space-y-2 text-sm text-neutral-600">
            <p>パスワードを忘れた方は、いったん管理者にご相談ください。</p>
            <Link
              href="/signup"
              className="font-medium text-neutral-900 underline underline-offset-4"
            >
              新規登録はこちら
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
