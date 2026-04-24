import Link from "next/link";
import { redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { cn } from "@/lib/utils";

export default async function TeacherLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  if (!user || user.role !== "teacher") {
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
          <p className="text-sm text-neutral-600">{user.display_name}</p>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
