"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell,
  GraduationCap,
  Home,
  Menu,
  Settings2,
  Sprout,
  X,
} from "lucide-react";
import { usePathname } from "next/navigation";

import { LogoutForm } from "@/components/auth/logout-form";
import { cn } from "@/lib/utils";

type SchoolOwnerMobileNavProps = {
  displayName: string;
  canSwitchToTeacher: boolean;
};

const NAV_ITEMS = [
  { href: "/", label: "ホーム", icon: Home },
  { href: "/schools", label: "教室", icon: Sprout },
  { href: "/settings", label: "設定", icon: Settings2 },
] as const;

const getInitial = (displayName: string) =>
  Array.from(displayName.trim())[0] ?? "先";

export function SchoolOwnerMobileNav({
  displayName,
  canSwitchToTeacher,
}: SchoolOwnerMobileNavProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const activeHref = useMemo(() => {
    if (pathname.startsWith("/schools")) {
      return "/schools";
    }

    if (pathname.startsWith("/settings")) {
      return "/settings";
    }

    return "/";
  }, [pathname]);

  return (
    <>
      <header className="sticky top-0 z-30 flex min-h-[68px] items-center justify-between border-b border-emerald-100 bg-white px-4 md:hidden">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700"
            aria-label="メニューを開く"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/schools" className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#bcefd4] via-[#9fe6c4] to-[#7fddb0] text-[#23463a] shadow-[0_10px_25px_rgba(127,221,176,0.35)]">
              <Sprout className="h-5 w-5" />
            </span>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-[1.25rem] font-extrabold tracking-tight text-slate-800">
                AllIn Note
              </p>
              <p className="text-[10px] font-semibold tracking-[0.18em] text-slate-400">
                オールインノート
              </p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500"
            aria-label="通知"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -right-1 -top-1 flex h-4.5 w-4.5 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-[9px] font-bold text-white">
              3
            </span>
          </button>
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#dff4e8] text-sm font-bold text-emerald-700">
            {getInitial(displayName)}
          </span>
        </div>
      </header>

      {isOpen ? (
        <div className="md:hidden">
          <button
            type="button"
            className="fixed inset-0 z-40 bg-[rgba(4,52,44,0.28)]"
            aria-label="メニューを閉じる"
            onClick={() => setIsOpen(false)}
          />

          <aside className="fixed inset-y-0 left-0 z-50 flex w-[84vw] max-w-[340px] flex-col border-r border-[#dcece5] bg-white shadow-[0_18px_48px_rgba(15,23,42,0.18)]">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#bcefd4] via-[#9fe6c4] to-[#7fddb0] text-[#23463a] shadow-[0_10px_25px_rgba(127,221,176,0.35)]">
                  <Sprout className="h-5 w-5" />
                </span>
                <div className="leading-tight">
                  <p className="text-[1.15rem] font-extrabold tracking-tight text-slate-800">
                    AllIn Note
                  </p>
                  <p className="text-[10px] font-semibold tracking-[0.16em] text-slate-400">
                    オールインノート
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500"
                aria-label="閉じる"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="border-b border-slate-100 px-4 py-4">
              <div className="flex items-center gap-3 rounded-[22px] bg-[#f4fbf8] px-3 py-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#dff4e8] text-base font-bold text-emerald-700">
                  {getInitial(displayName)}
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-800">{displayName}</p>
                  <p className="text-[11px] font-medium text-slate-400">教室オーナー</p>
                </div>
              </div>
            </div>

            <nav className="flex-1 px-3 py-4">
              <div className="space-y-2">
                {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
                      activeHref === href
                        ? "bg-emerald-100 text-emerald-700"
                        : "text-slate-600 hover:bg-emerald-50 hover:text-slate-900"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                ))}
              </div>

              {canSwitchToTeacher ? (
                <div className="mt-5 rounded-[22px] border border-emerald-200 bg-emerald-50 p-3">
                  <p className="text-[11px] font-semibold tracking-[0.18em] text-emerald-700">
                    WORKSPACE
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#0F6E56]">
                    講師としての録音や送信作業に切り替えられます。
                  </p>
                  <Link
                    href="/dashboard"
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1D9E75] px-4 py-3 text-sm font-semibold text-white"
                  >
                    <GraduationCap className="h-4 w-4" />
                    講師画面へ
                  </Link>
                </div>
              ) : null}
            </nav>

            <div className="border-t border-slate-100 px-4 py-4">
              <LogoutForm className="h-11 w-full justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100" />
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
