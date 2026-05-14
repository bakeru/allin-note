import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getHomePathForRole } from "@/lib/auth/navigation";

export default async function Home() {
  const user = await getCurrentUser();
  const isMockMode =
    process.env.NEXT_PUBLIC_AUTH_MODE === "mock" ||
    process.env.NEXT_PUBLIC_USE_MOCK_AUTH === "true";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(168,232,200,0.3),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(127,221,176,0.18),_transparent_30%),linear-gradient(180deg,_#f8fcfa_0%,_#eef7f2_100%)] px-6 py-16 text-slate-900">
      <section className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <div className="mb-6 inline-flex items-center gap-3 rounded-full bg-white/90 px-4 py-2 shadow-sm ring-1 ring-emerald-100">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-200 font-semibold text-slate-900">
              AI
            </span>
            <div className="text-left">
              <p className="text-lg font-extrabold tracking-tight">AllIn Note</p>
              <p className="text-xs font-medium tracking-[0.2em] text-slate-500">
                オールインノート
              </p>
            </div>
          </div>
          <h1 className="max-w-3xl text-5xl font-extrabold tracking-tight text-slate-950 sm:text-6xl">
            教室運営を、やさしく整える。
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            予約、講師、生徒、レッスンノートまでをひとつにまとめて、
            教室の毎日を少し軽くするためのプロダクトです。
          </p>
          <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-600">
            <span className="rounded-full bg-white px-4 py-2 ring-1 ring-emerald-100">
              予約管理
            </span>
            <span className="rounded-full bg-white px-4 py-2 ring-1 ring-emerald-100">
              レッスン録音
            </span>
            <span className="rounded-full bg-white px-4 py-2 ring-1 ring-emerald-100">
              AI要約
            </span>
            <span className="rounded-full bg-white px-4 py-2 ring-1 ring-emerald-100">
              招待・権限管理
            </span>
          </div>
          {isMockMode ? (
            <>
              <p className="mt-10 text-sm font-semibold text-slate-500">開発用導線</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/schools"
                  className={buttonVariants({
                    size: "lg",
                    className:
                      "rounded-xl bg-emerald-500 px-6 text-white hover:bg-emerald-400 hover:text-white",
                  })}
                >
                  教室画面へ
                </Link>
                <Link
                  href="/dashboard"
                  className={buttonVariants({
                    size: "lg",
                    className:
                      "rounded-xl bg-slate-900 px-6 text-white hover:bg-slate-800 hover:text-white",
                  })}
                >
                  講師ダッシュボード
                </Link>
                <Link
                  href="/record"
                  className={buttonVariants({
                    size: "lg",
                    variant: "outline",
                    className:
                      "rounded-xl border-emerald-200 bg-white px-6 text-slate-900 hover:bg-emerald-50 hover:text-slate-900",
                  })}
                >
                  録音画面
                </Link>
                <Link
                  href="/student/dashboard"
                  className={buttonVariants({
                    size: "lg",
                    variant: "outline",
                    className:
                      "rounded-xl border-sky-200 bg-white px-6 text-slate-900 hover:bg-sky-50 hover:text-slate-900",
                  })}
                >
                  生徒画面へ
                </Link>
              </div>
            </>
          ) : user ? (
            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href={getHomePathForRole(user.role)}
                className={buttonVariants({
                  size: "lg",
                  className:
                    "rounded-xl bg-emerald-500 px-6 text-white hover:bg-emerald-400 hover:text-white",
                })}
              >
                ダッシュボードへ
              </Link>
            </div>
          ) : (
            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className={buttonVariants({
                  size: "lg",
                  className:
                    "rounded-xl bg-emerald-500 px-6 text-white hover:bg-emerald-400 hover:text-white",
                })}
              >
                新規登録
              </Link>
              <Link
                href="/login"
                className={buttonVariants({
                  size: "lg",
                  variant: "outline",
                  className:
                    "rounded-xl border-emerald-200 bg-white px-6 text-slate-900 hover:bg-emerald-50 hover:text-slate-900",
                })}
              >
                ログイン
              </Link>
            </div>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-[28px] bg-white p-6 shadow-[0_20px_60px_rgba(15,31,46,0.08)] ring-1 ring-emerald-100">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-xl">
                予
              </div>
              <div>
                <p className="font-bold text-slate-950">予約をひと目で</p>
                <p className="text-sm text-slate-500">週間の予定をすっきり確認</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="rounded-2xl bg-emerald-50 p-4">
                <p className="text-sm font-semibold text-emerald-700">本日の予約</p>
                <p className="mt-2 text-3xl font-extrabold text-slate-950">8件</p>
              </div>
              <div className="rounded-2xl border border-slate-100 p-4">
                <p className="text-sm font-semibold text-slate-500">次のレッスン</p>
                <p className="mt-2 font-bold text-slate-950">13:00 中1 数学</p>
                <p className="text-sm text-slate-500">山田先生 / 教室A</p>
              </div>
            </div>
          </div>
          <div className="rounded-[28px] bg-slate-900 p-6 text-white shadow-[0_20px_60px_rgba(15,31,46,0.12)]">
            <p className="text-sm font-semibold tracking-[0.2em] text-emerald-300">
              LESSON NOTE
            </p>
            <p className="mt-4 text-2xl font-extrabold">
              AI要約から、先生の言葉へ。
            </p>
            <p className="mt-3 text-sm leading-7 text-white/70">
              録音、要約、編集、送信までをつなげて、生徒や保護者への連絡を自然な流れにします。
            </p>
            <div className="mt-8 space-y-3">
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-sm text-white/60">送信前確認</p>
                <p className="mt-1 font-semibold">本日のポイント / 次回までの宿題 / 先生からひとこと</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-sm text-white/60">共有方法</p>
                <p className="mt-1 font-semibold">メール通知と生徒画面にそのまま反映</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
