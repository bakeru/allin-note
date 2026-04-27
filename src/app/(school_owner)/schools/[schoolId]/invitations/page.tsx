import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { cancelInvitationAction } from "@/actions/auth";
import { CopyInvitationLink } from "@/components/invitations/copy-invitation-link";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("ja-JP", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
      }).format(new Date(value))
    : "-";

const getStatusLabel = (status: string, acceptedAt: string | null) => {
  switch (status) {
    case "accepted":
      return acceptedAt ? `受諾済み(${formatDate(acceptedAt)})` : "受諾済み";
    case "expired":
      return "期限切れ";
    case "cancelled":
      return "キャンセル済み";
    default:
      return "未使用";
  }
};

export default async function InvitationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ schoolId: string }>;
  searchParams?: Promise<{ created?: string }>;
}) {
  const { schoolId } = await params;
  const resolvedSearchParams = await searchParams;
  const createdToken = resolvedSearchParams?.created;
  const user = await getCurrentUser();

  if (!user || user.role !== "school_owner") {
    redirect("/");
  }

  const supabase = createServiceClient();
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [{ data: school, error: schoolError }, { data: invitations, error }] =
    await Promise.all([
      supabase
        .from("schools")
        .select("id, name")
        .eq("id", schoolId)
        .eq("owner_id", user.id)
        .single(),
      supabase
        .from("invitations")
        .select(
          `
            id,
            email,
            role,
            token,
            status,
            created_at,
            expires_at,
            accepted_at
          `
        )
        .eq("school_id", schoolId)
        .gte("created_at", startOfMonth.toISOString())
        .order("created_at", { ascending: false }),
    ]);

  if (schoolError) {
    throw new Error(schoolError.message);
  }

  if (!school) {
    notFound();
  }

  if (error) {
    if (error.message.includes("public.invitations")) {
      return (
        <div className="mx-auto max-w-5xl px-5 py-8">
          <Card className="rounded-lg border-0 bg-white ring-1 ring-neutral-200">
            <CardHeader>
              <CardTitle className="text-2xl">招待管理</CardTitle>
              <CardDescription>
                先に `add_invitations` マイグレーションを実行してください。
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      );
    }
    throw new Error(error.message);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const createdUrl =
    typeof createdToken === "string" && createdToken
      ? `${appUrl}/invite/${createdToken}`
      : null;

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl flex-col gap-6 px-5 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <Link
            href={`/schools/${schoolId}`}
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            教室詳細へ戻る
          </Link>
          <h1 className="text-3xl font-semibold text-neutral-950">招待管理</h1>
          <p className="text-sm text-neutral-600">{school.name}の招待一覧です。</p>
        </div>
        <Link href={`/schools/${schoolId}/invitations/new`} className={buttonVariants()}>
          + 新しい招待を作成
        </Link>
      </div>

      {createdUrl ? (
        <Card className="rounded-lg border-0 bg-emerald-50 ring-1 ring-emerald-200">
          <CardHeader>
            <CardTitle className="text-xl text-emerald-950">
              招待リンクを発行しました
            </CardTitle>
            <CardDescription className="text-emerald-800">
              ここからリンクをコピーして相手に共有できます。
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <code className="overflow-x-auto rounded-lg bg-white px-3 py-2 text-xs text-neutral-700 ring-1 ring-emerald-200">
              {createdUrl}
            </code>
            <CopyInvitationLink url={createdUrl} />
          </CardContent>
        </Card>
      ) : null}

      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-neutral-950">今月の招待</h2>
          <p className="text-sm text-neutral-600">発行済みリンクの状態を確認します。</p>
        </div>
        {invitations?.length ? (
          <div className="grid gap-4">
            {invitations.map((invitation) => {
              const url = `${appUrl}/invite/${invitation.token}`;

              return (
                <Card
                  key={invitation.id}
                  className="rounded-lg border-0 bg-white ring-1 ring-neutral-200"
                >
                  <CardHeader>
                    <CardTitle className="text-lg text-neutral-950">
                      {invitation.email} ({invitation.role === "teacher" ? "講師招待" : "生徒招待"})
                    </CardTitle>
                    <CardDescription>
                      発行日: {formatDate(invitation.created_at)} / 有効期限:{" "}
                      {formatDate(invitation.expires_at)} / ステータス:{" "}
                      {getStatusLabel(invitation.status, invitation.accepted_at)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-3">
                    <CopyInvitationLink url={url} />
                    {invitation.status === "pending" ? (
                      <form action={cancelInvitationAction}>
                        <input type="hidden" name="invitation_id" value={invitation.id} />
                        <input type="hidden" name="school_id" value={schoolId} />
                        <Button type="submit" variant="ghost" size="sm">
                          キャンセル
                        </Button>
                      </form>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="rounded-lg border-0 bg-white ring-1 ring-neutral-200">
            <CardContent className="py-8 text-sm text-neutral-600">
              今月の招待はまだありません。
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
