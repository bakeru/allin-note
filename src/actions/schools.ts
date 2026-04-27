"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/get-current-user";
import { createServiceClient } from "@/lib/supabase/service";

export async function createSchoolAction(
  name: string,
  description: string | null,
  alsoBeATeacher: boolean
) {
  const user = await getCurrentUser();

  if (!user || user.role !== "school_owner") {
    throw new Error("Unauthorized");
  }

  const supabase = createServiceClient();
  const { data: school, error } = await supabase
    .from("schools")
    .insert({
      name,
      description,
      owner_id: user.id,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (alsoBeATeacher) {
    const { error: teacherLinkError } = await supabase
      .from("school_teachers")
      .insert({
        school_id: school.id,
        teacher_id: user.id,
        role: "owner",
      });

    if (teacherLinkError) {
      throw new Error(teacherLinkError.message);
    }
  }

  revalidatePath("/schools");
  return school;
}

export async function createSchoolFormAction(formData: FormData) {
  const name = formData.get("name");
  const description = formData.get("description");
  const alsoBeATeacher = formData.get("also_be_a_teacher");

  if (typeof name !== "string" || !name.trim()) {
    throw new Error("教室名を入力してください。");
  }

  const school = await createSchoolAction(
    name.trim(),
    typeof description === "string" && description.trim()
      ? description.trim()
      : null,
    alsoBeATeacher === "on"
  );

  redirect(`/schools/${school.id}`);
}
