"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/get-current-user";
import { createServiceClient } from "@/lib/supabase/service";

export async function deleteInvitationAction(formData: FormData) {
  const user = await getCurrentUser();

  if (!user || user.role !== "school_owner") {
    throw new Error("Unauthorized");
  }

  const invitationId = formData.get("invitation_id");
  const schoolId = formData.get("school_id");

  if (typeof invitationId !== "string" || !invitationId) {
    throw new Error("招待IDが見つかりません。");
  }

  if (typeof schoolId !== "string" || !schoolId) {
    throw new Error("教室IDが見つかりません。");
  }

  const supabase = createServiceClient();
  const { data: school, error: schoolError } = await supabase
    .from("schools")
    .select("id")
    .eq("id", schoolId)
    .eq("owner_id", user.id)
    .is("deleted_at", null)
    .single();

  if (schoolError) {
    throw new Error(schoolError.message);
  }

  if (!school) {
    throw new Error("この教室は操作できません。");
  }

  const { error } = await supabase
    .from("invitations")
    .delete()
    .eq("id", invitationId)
    .eq("school_id", schoolId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/schools/${schoolId}/invitations`);
}
