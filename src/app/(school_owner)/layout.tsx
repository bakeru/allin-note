import Link from "next/link";
import { Bell, Home, Settings2, Sprout } from "lucide-react";
import { redirect } from "next/navigation";

import { LogoutForm } from "@/components/auth/logout-form";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "ホーム", icon: Home },
  { href: "/schools", label: "教室", icon: Sprout },
  { href: "/settings", label: "設定", icon: Settings2 },
];

export default async function SchoolOwnerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  if (!user || user.role !== "school_owner") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-[#22303d] px-5 py-5 text-slate-900">
      <div className="mx-auto min-h-[calc(100vh-2.5rem)] max-w-[1480px] overflow-hidden rounded-[28px] border border-[#2e3d4d] bg-[#f8fbf9] shadow-[0_32px_90px_rgba(0,0,0,0.32)]">
        <header className="flex min-h-[72px] items-center justify-between border-b border-emerald-100 bg-white px-7">
          <div className="flex items-center gap-10">
            <Link href="/schools" className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#bcefd4] via-[#9fe6c4] to-[#7fddb0] text-[#23463a] shadow-[0_10px_25px_rgba(127,221,176,0.35)]">
                <Sprout className="h-5 w-5" />
              </span>
              <div className="leading-tight">
                <p className="text-[1.65rem] font-extrabold tracking-tight text-slate-800">
                  AllIn Note
                </p>
                <p className="text-[11px] font-semibold tracking-[0.22em] text-slate-400">
                  オールインノート
                </p>
              </div>
            </Link>

            <nav className="flex items-center gap-1">
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-slate-500 transition hover:bg-emerald-50 hover:text-slate-900",
                      href === "/schools"
                        ? "bg-emerald-100 text-emerald-700"
                        : ""
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-700"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-[10px] font-bold text-white">
                3
              </span>
            </button>

            <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-2 py-1.5">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#dff4e8] text-sm font-bold text-emerald-700">
                {user.display_name.slice(0, 1)}
              </span>
              <div className="pr-2 leading-tight">
                <p className="text-sm font-bold text-slate-800">
                  {user.display_name}
                </p>
                <p className="text-[11px] font-medium text-slate-400">
                  教室オーナー
                </p>
              </div>
              <LogoutForm className="text-slate-500" />
            </div>
          </div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
