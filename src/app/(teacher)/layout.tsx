import Link from "next/link";
import { School2 } from "lucide-react";
import { redirect } from "next/navigation";

import { LogoutForm } from "@/components/auth/logout-form";
import { buttonVariants } from "@/components/ui/button";
import { getTeacherWorkspaceUser } from "@/lib/auth/teacher-access";
import { cn } from "@/lib/utils";

export default async function TeacherLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getTeacherWorkspaceUser();

  if (!user) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-950">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex min-h-16 max-w-5xl flex-col gap-3 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <p className="text-lg font-semibold">AllIn Note</p>
            <nav className="flex items-center gap-1">
              {[
                { href: "/", label: "ホーム" },
                { href: "/dashboard", label: "ダッシュボード" },
                { href: "/record", label: "録音" },
                { href: "/reservations", label: "予約" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "text-neutral-600"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            {user.role === "school_owner" ? (
              <Link
                href="/schools"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
                )}
              >
                <School2 className="mr-1 h-4 w-4" />
                教室画面へ
              </Link>
            ) : null}
            <p className="text-sm text-neutral-600">{user.display_name}</p>
            <LogoutForm className="text-neutral-600" />
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
