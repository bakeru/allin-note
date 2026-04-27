import Link from "next/link";
import { redirect } from "next/navigation";

import { signUpAction } from "@/actions/auth";
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

export default async function SignupPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect(getHomePathForRole(user.role));
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 py-10">
      <Card className="w-full max-w-xl rounded-lg border-0 bg-white ring-1 ring-neutral-200">
        <CardHeader>
          <CardTitle className="text-2xl">新規登録</CardTitle>
          <CardDescription>
            β版では教室オーナーのみここから登録できます。講師・生徒は招待リンクから参加します。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={signUpAction} className="space-y-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">パスワード</Label>
                <Input id="password" name="password" type="password" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="display_name">お名前</Label>
              <Input id="display_name" name="display_name" required />
            </div>
            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-neutral-900">ロール</legend>
              <label className="flex items-start gap-3 rounded-lg border border-neutral-200 px-4 py-3">
                <input type="radio" name="role" value="school_owner" defaultChecked />
                <div>
                  <p className="font-medium text-neutral-950">教室オーナー</p>
                  <p className="text-sm text-neutral-600">教室を運営する方向けです。</p>
                </div>
              </label>
              <label className="flex items-start gap-3 rounded-lg border border-neutral-200 px-4 py-3 opacity-70">
                <input type="radio" name="role" value="teacher" />
                <div>
                  <p className="font-medium text-neutral-950">講師</p>
                  <p className="text-sm text-neutral-600">招待リンクから登録します。</p>
                </div>
              </label>
              <label className="flex items-start gap-3 rounded-lg border border-neutral-200 px-4 py-3 opacity-70">
                <input type="radio" name="role" value="student" />
                <div>
                  <p className="font-medium text-neutral-950">生徒・保護者</p>
                  <p className="text-sm text-neutral-600">招待リンクから登録します。</p>
                </div>
              </label>
            </fieldset>
            <button type="submit" className={buttonVariants({ className: "w-full" })}>
              登録する
            </button>
          </form>
          <p className="mt-6 text-sm text-neutral-600">
            すでにアカウントをお持ちの方は{" "}
            <Link
              href="/login"
              className="font-medium text-neutral-900 underline underline-offset-4"
            >
              ログイン
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
