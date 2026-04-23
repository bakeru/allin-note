import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/get-current-user";

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
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
          <p className="text-lg font-semibold">AllIn Note</p>
          <p className="text-sm text-neutral-600">{user.display_name}</p>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
