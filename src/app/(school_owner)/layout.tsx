import Link from "next/link";
import { redirect } from "next/navigation";

import { LogoutForm } from "@/components/auth/logout-form";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { cn } from "@/lib/utils";

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
    <div className="min-h-screen bg-emerald-50 text-neutral-950">
      <header className="border-b border-emerald-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-6xl flex-col gap-3 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <p className="text-lg font-semibold">AllIn Note</p>
            <nav className="flex items-center gap-1">
              {[
                { href: "/", label: "ホーム" },
                { href: "/schools", label: "教室" },
                { href: "/settings", label: "設定" },
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
            <p className="text-sm text-neutral-600">{user.display_name}</p>
            <LogoutForm className="text-neutral-600" />
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
