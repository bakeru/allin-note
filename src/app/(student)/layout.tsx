import Link from "next/link";
import { redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { cn } from "@/lib/utils";

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
    <div className="min-h-screen bg-sky-50 text-slate-900">
      <header className="border-b border-sky-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-5xl flex-col gap-3 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <p className="text-lg font-semibold text-slate-900">AllIn Note</p>
            <nav className="flex items-center gap-1">
              {[
                { href: "/", label: "ホーム" },
                { href: "/student/dashboard", label: "レッスン" },
                { href: "/student/reservations/new", label: "予約" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "text-slate-600"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <p className="text-sm text-slate-600">{user.display_name}</p>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
