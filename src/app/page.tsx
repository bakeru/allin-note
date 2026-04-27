import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 text-white">
      <section className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <p className="mb-6 rounded-full border border-white/15 px-4 py-1.5 text-sm font-medium text-white/70">
          Coming Soon
        </p>
        <h1 className="text-5xl font-semibold tracking-tight sm:text-7xl">
          AllIn Note
        </h1>
        <p className="mt-6 text-lg leading-8 text-white/70 sm:text-xl">
          AIが書いてくれる、教室のカルテと連絡ノート
        </p>
        <p className="mt-8 text-sm text-white/50">開発用導線</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/dashboard"
            className={buttonVariants({
              size: "lg",
              className: "bg-white px-6 text-neutral-950 hover:bg-white/90",
            })}
          >
            ダッシュボードへ(講師)
          </Link>
          <Link
            href="/record"
            className={buttonVariants({
              size: "lg",
              variant: "outline",
              className: "border-white/20 px-6 text-white hover:bg-white/10",
            })}
          >
            録音画面へ(講師)
          </Link>
          <Link
            href="/student/dashboard"
            className={buttonVariants({
              size: "lg",
              className: "bg-sky-500 px-6 text-white hover:bg-sky-400",
            })}
          >
            生徒画面へ(生徒)
          </Link>
        </div>
      </section>
    </main>
  );
}
