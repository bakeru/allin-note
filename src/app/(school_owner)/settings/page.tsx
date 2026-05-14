import { redirect } from "next/navigation";

import { AvatarSettingsCard } from "@/components/settings/avatar-settings-card";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export const dynamic = "force-dynamic";

export default async function SchoolOwnerSettingsPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "school_owner") {
    redirect("/");
  }

  return (
    <div className="flex min-h-[calc(100vh-68px)] items-start justify-center bg-[rgba(15,31,46,0.08)] px-4 py-6 md:min-h-[720px] md:items-center md:px-8 md:py-10">
      <AvatarSettingsCard displayName={user.display_name} />
    </div>
  );
}
