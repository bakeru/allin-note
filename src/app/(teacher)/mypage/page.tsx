import Link from "next/link";
import {
  Bell,
  BookOpenText,
  Building2,
  ChevronRight,
  LayoutDashboard,
  Mail,
  Mic,
  Send,
  UserRound,
  Users,
} from "lucide-react";
import { redirect } from "next/navigation";

import { LogoutForm } from "@/components/auth/logout-form";
import { Card, CardContent } from "@/components/ui/card";
import { getTeacherWorkspaceUser } from "@/lib/auth/teacher-access";
import { createServiceClient } from "@/lib/supabase/service";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type ActionItem = {
  href: string;
  label: string;
  description: string;
  icon: typeof LayoutDashboard;
  tone?: "mint" | "neutral";
};

const getRoleLabel = (role: "school_owner" | "teacher" | "student") => {
  if (role === "school_owner") {
    return "教室オーナー / 講師";
  }

  if (role === "teacher") {
    return "講師";
  }

  return "生徒";
};

const getShortName = (displayName: string) =>
  displayName.trim().split(/[\s　]+/)[0] ?? displayName;

export default async function TeacherMyPage() {
  const user = await getTeacherWorkspaceUser();

  if (!user) {
    redirect("/");
  }

  const supabase = createServiceClient();
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const [
    { count: studentCount, error: studentError },
    { count: unsentCount, error: unsentError },
    { count: todayLessonCount, error: todayLessonError },
  ] = await Promise.all([
    supabase
      .from("students")
      .select("user_id", { count: "exact", head: true })
      .eq("teacher_id", user.id)
      .is("deleted_at", null),
    supabase
      .from("lessons")
      .select("id", { count: "exact", head: true })
      .eq("teacher_id", user.id)
      .is("sent_at", null),
    supabase
      .from("reservations")
      .select("id", { count: "exact", head: true })
      .eq("teacher_id", user.id)
      .gte("scheduled_at", todayStart.toISOString())
      .lt("scheduled_at", todayEnd.toISOString())
      .neq("status", "completed"),
  ]);

  if (studentError) {
    throw new Error(studentError.message);
  }

  if (unsentError) {
    throw new Error(unsentError.message);
  }

  if (todayLessonError) {
    throw new Error(todayLessonError.message);
  }

  const quickActions: ActionItem[] = [
    {
      href: "/dashboard",
      label: "ホーム",
      description: "今日の予定と送信待ちを確認します。",
      icon: LayoutDashboard,
      tone: "mint",
    },
    {
      href: "/reservations",
      label: "レッスン",
      description: "今後の予約や最近の履歴をまとめて見られます。",
      icon: BookOpenText,
    },
    {
      href: "/record",
      label: "録音を始める",
      description: "今日の予約、または手動録音の入口に進みます。",
      icon: Mic,
      tone: "mint",
    },
    {
      href: "/karte",
      label: "カルテを見る",
      description: "生徒ごとの記録を時系列で振り返ります。",
      icon: Users,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f7faf8] px-5 py-6 md:mx-auto md:max-w-5xl md:px-6 md:py-8">
      <div className="mb-5 md:mb-8">
        <p className="text-[11px] font-semibold tracking-[0.22em] text-[#1D9E75]">
          MY PAGE
        </p>
        <h1 className="mt-2 text-[2rem] font-semibold tracking-tight text-slate-900 md:text-3xl">
          マイページ
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          講師としての今日の状況と、よく使う導線をここにまとめています。
        </p>
      </div>

      <Card className="mb-6 rounded-[28px] border border-[#d9eee6] bg-white shadow-[0_16px_36px_rgba(15,23,42,0.05)]">
        <CardContent className="flex flex-col gap-5 p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#E1F5EE] text-[2rem] font-bold text-[#1D9E75]">
              {Array.from(user.display_name)[0] ?? "先"}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-2xl font-semibold text-slate-900">
                  {getShortName(user.display_name)}さん
                </p>
                <span className="rounded-full bg-[#E1F5EE] px-2.5 py-1 text-[11px] font-semibold text-[#0F6E56]">
                  {getRoleLabel(user.role)}
                </span>
              </div>
              <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                <Mail className="h-4 w-4" />
                {user.email}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 md:min-w-[280px]">
            <StatTile label="今日の予定" value={todayLessonCount ?? 0} unit="件" />
            <StatTile label="送信待ち" value={unsentCount ?? 0} unit="件" />
            <StatTile label="担当生徒" value={studentCount ?? 0} unit="人" />
          </div>
        </CardContent>
      </Card>

      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">すぐ使う</h2>
          <span className="text-[11px] font-medium text-slate-400">
            よく使う導線
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {quickActions.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-start gap-3 rounded-[24px] border bg-white px-4 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.04)] transition hover:border-[#9FE1CB] hover:bg-[#fbfefd]",
                  item.tone === "mint" ? "border-[#d9eee6]" : "border-slate-200"
                )}
              >
                <span
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-full",
                    item.tone === "mint"
                      ? "bg-[#E1F5EE] text-[#1D9E75]"
                      : "bg-slate-100 text-slate-500"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-slate-900">
                    {item.label}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-slate-500">
                    {item.description}
                  </span>
                </span>
                <ChevronRight className="mt-1 h-4 w-4 text-slate-400" />
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mb-6 grid gap-3 md:grid-cols-2">
        <Card className="rounded-[24px] border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
          <CardContent className="p-5">
            <div className="mb-3 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E1F5EE] text-[#1D9E75]">
                <Send className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">今日の整理</p>
                <p className="text-xs text-slate-500">やり残しを減らすためのショートカットです。</p>
              </div>
            </div>
            <div className="space-y-2">
              <ShortcutRow
                href="/reservations"
                label="送信待ちのノートを確認する"
                meta={`${unsentCount ?? 0}件`}
              />
              <ShortcutRow
                href="/record"
                label="録音の入口を開く"
                meta="今日の予約から開始"
              />
              <ShortcutRow
                href="/karte"
                label="担当生徒の履歴を見る"
                meta={`${studentCount ?? 0}人`}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[24px] border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
          <CardContent className="p-5">
            <div className="mb-3 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eef6ff] text-[#2563eb]">
                <Bell className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">ワークスペース</p>
                <p className="text-xs text-slate-500">必要な画面にすぐ切り替えられます。</p>
              </div>
            </div>

            <div className="space-y-2">
              <ShortcutRow
                href="/dashboard"
                label="講師ホームに戻る"
                meta="今日の状況を見る"
              />
              {user.role === "school_owner" ? (
                <Link
                  href="/schools"
                  className="flex items-center justify-between rounded-2xl border border-[#9FE1CB] bg-[#E1F5EE] px-4 py-3 transition hover:bg-[#d5f1e7]"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#1D9E75]">
                      <Building2 className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-[#04342C]">
                        教室画面へ切り替える
                      </span>
                      <span className="mt-0.5 block text-xs text-[#0F6E56]/80">
                        オーナーモードの設定や管理へ戻ります。
                      </span>
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-[#0F6E56]" />
                </Link>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-400">
                      <UserRound className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-slate-700">
                        講師ワークスペースを利用中
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        今日はこのまま録音と送信の流れに集中できます。
                      </span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="rounded-[24px] border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
        <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">ログアウト</p>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              別のアカウントに切り替える場合はこちらからログアウトできます。
            </p>
          </div>
          <div className="flex justify-start md:justify-end">
            <LogoutForm className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-700 hover:bg-slate-100" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatTile({
  label,
  value,
  unit,
}: {
  label: string;
  value: number;
  unit: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-[#fbfefd] px-3 py-3">
      <p className="text-[10px] text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-900">
        {value}
        <span className="ml-0.5 text-[11px] font-normal text-slate-400">
          {unit}
        </span>
      </p>
    </div>
  );
}

function ShortcutRow({
  href,
  label,
  meta,
}: {
  href: string;
  label: string;
  meta: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 transition hover:border-[#9FE1CB] hover:bg-[#fbfefd]"
    >
      <span>
        <span className="block text-sm font-semibold text-slate-900">{label}</span>
        <span className="mt-0.5 block text-xs text-slate-500">{meta}</span>
      </span>
      <ChevronRight className="h-4 w-4 text-slate-400" />
    </Link>
  );
}
