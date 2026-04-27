import Link from "next/link";
import { redirect } from "next/navigation";

import { signInAction } from "@/actions/auth";
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
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 py-10">
      <Card className="w-full max-w-md rounded-lg border-0 bg-white ring-1 ring-neutral-200">
        <CardHeader>
          <CardTitle className="text-2xl">ログイン</CardTitle>
          <CardDescription>
            既存のアカウントでAllIn Noteに入ります。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={signInAction} className="space-y-5">
            {redirectTo ? (
              <input type="hidden" name="redirect_to" value={redirectTo} />
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <button type="submit" className={buttonVariants({ className: "w-full" })}>
              ログイン
            </button>
          </form>
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
