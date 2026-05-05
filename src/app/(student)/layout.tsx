import Link from "next/link";
import { redirect } from "next/navigation";

import { LogoutForm } from "@/components/auth/logout-form";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export default async function StudentLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  if (!user || user.role !== "student") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-[#f7fbf8] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-emerald-100/80 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex min-h-14 max-w-md items-center justify-between px-5 sm:max-w-5xl">
          <Link href="/student/dashboard" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-300 via-emerald-400 to-emerald-500 text-sm font-bold text-slate-950 shadow-[0_8px_24px_rgba(45,212,191,0.28)]">
              Ai
            </span>
            <div>
              <p className="text-sm font-semibold tracking-tight text-slate-950">
                AllIn Note
              </p>
              <p className="text-[11px] font-medium text-slate-500">
                Student View
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-700">
                {user.display_name}
              </p>
              <p className="text-[11px] text-slate-500">レッスンノート</p>
            </div>
            <LogoutForm className="text-slate-600" />
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
