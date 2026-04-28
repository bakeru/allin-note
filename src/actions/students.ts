"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/get-current-user";
import { createServiceClient } from "@/lib/supabase/service";

export async function removeStudentFromSchoolAction(formData: FormData) {
  const user = await getCurrentUser();

  if (!user || user.role !== "school_owner") {
    throw new Error("Unauthorized");
  }

  const schoolId = formData.get("school_id");
  const studentId = formData.get("student_id");

  if (typeof schoolId !== "string" || !schoolId) {
    throw new Error("教室IDが見つかりません。");
  }

  if (typeof studentId !== "string" || !studentId) {
    throw new Error("生徒IDが見つかりません。");
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
    .from("students")
    .update({ deleted_at: new Date().toISOString() })
    .eq("user_id", studentId)
    .eq("school_id", schoolId)
    .is("deleted_at", null);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/schools/${schoolId}/students`);
  revalidatePath(`/schools/${schoolId}`);
}
