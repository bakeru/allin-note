import Link from "next/link";
import { notFound } from "next/navigation";

import { acceptInvitationAction } from "@/actions/auth";
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

const formatInvitationRole = (role: string) =>
  role === "teacher" ? "講師として参加" : "生徒・保護者として参加";

export default async function InvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const currentUser = await getCurrentUser();
  const supabase = createServiceClient();
  const { data: invitation, error } = await supabase
    .from("invitations")
    .select(
      `
        id,
        email,
        role,
        expires_at,
        status,
        school:schools!invitations_school_id_fkey(name),
        inviter:profiles!invitations_invited_by_fkey(display_name)
      `
    )
    .eq("token", token)
    .single();

  if (error?.message.includes("public.invitations")) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 py-10">
        <Card className="w-full max-w-xl rounded-lg border-0 bg-white ring-1 ring-neutral-200">
          <CardHeader>
            <CardTitle className="text-2xl">招待機能を準備中です</CardTitle>
            <CardDescription>
              先に `add_invitations` マイグレーションを実行してください。
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  if (error || !invitation) {
    notFound();
  }

  const invitationStatus =
    invitation.status === "pending" &&
    new Date(invitation.expires_at).getTime() < Date.now()
      ? "expired"
      : invitation.status;

  const school = Array.isArray(invitation.school)
    ? invitation.school[0]
    : invitation.school;
  const inviter = Array.isArray(invitation.inviter)
    ? invitation.inviter[0]
    : invitation.inviter;

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 py-10">
      <Card className="w-full max-w-xl rounded-lg border-0 bg-white ring-1 ring-neutral-200">
        <CardHeader>
          <CardTitle className="text-2xl">教室への招待</CardTitle>
          <CardDescription>
            「{school?.name ?? "教室"}」から招待されました。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
            <p>招待の種類: {formatInvitationRole(invitation.role)}</p>
            <p>招待者: {inviter?.display_name ?? "教室管理者"}</p>
            <p>メールアドレス: {invitation.email}</p>
          </div>

          {invitationStatus !== "pending" ? (
            <p className="text-sm text-neutral-600">
              この招待は現在利用できません。ステータス: {invitationStatus}
            </p>
          ) : currentUser ? (
            <div className="space-y-4">
              <p className="text-sm text-neutral-600">
                すでにログインしています。このアカウントで参加できます。
              </p>
              <form action={acceptInvitationAction}>
                <input type="hidden" name="token" value={token} />
                <button type="submit" className={buttonVariants({ className: "w-full" })}>
                  このアカウントで参加
                </button>
              </form>
            </div>
          ) : (
            <form action={acceptInvitationAction} className="space-y-5">
              <input type="hidden" name="token" value={token} />
              <div className="space-y-2">
                <Label htmlFor="invite-email">メールアドレス</Label>
                <Input id="invite-email" value={invitation.email} readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="display_name">お名前</Label>
                <Input id="display_name" name="display_name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">パスワード</Label>
                <Input id="password" name="password" type="password" required />
              </div>
              <button type="submit" className={buttonVariants({ className: "w-full" })}>
                登録して参加
              </button>
            </form>
          )}

          {!currentUser && invitationStatus === "pending" ? (
            <p className="text-sm text-neutral-600">
              既にアカウントをお持ちの方は{" "}
              <Link
                href={`/login?invite=${token}`}
                className="font-medium text-neutral-900 underline underline-offset-4"
              >
                ログイン
              </Link>
            </p>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
