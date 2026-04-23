import { redirect } from "next/navigation";

import { RecorderPanel } from "@/components/recording/recorder-panel";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export default async function RecordPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "teacher") {
    redirect("/");
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <RecorderPanel />
    </div>
  );
}
