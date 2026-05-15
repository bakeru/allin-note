import { cache } from "react";

import { type CurrentUser, getCurrentUser } from "@/lib/auth/get-current-user";
import { createServiceClient } from "@/lib/supabase/service";

const getTeacherWorkspaceMembership = cache(async (userId: string) => {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("school_teachers")
    .select("id")
    .eq("teacher_id", userId)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
});

export async function hasTeacherWorkspaceMembership(userId: string) {
  return getTeacherWorkspaceMembership(userId);
}

export async function canAccessTeacherWorkspace(user: CurrentUser | null) {
  if (!user) {
    return false;
  }

  if (user.role === "teacher") {
    return true;
  }

  if (user.role !== "school_owner") {
    return false;
  }

  return hasTeacherWorkspaceMembership(user.id);
}

const getTeacherWorkspaceUserCached = cache(async () => {
  const user = await getCurrentUser();

  if (await canAccessTeacherWorkspace(user)) {
    return user;
  }

  return null;
});

export async function getTeacherWorkspaceUser() {
  return getTeacherWorkspaceUserCached();
}
