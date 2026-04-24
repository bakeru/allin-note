import { redirect } from "next/navigation";

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
    <div className="min-h-screen bg-sky-50 text-slate-900">
      <header className="border-b border-sky-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
          <p className="text-lg font-semibold text-slate-900">AllIn Note</p>
          <p className="text-sm text-slate-600">{user.display_name}</p>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
