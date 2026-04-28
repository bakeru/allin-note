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

export async function deleteSchoolAction(formData: FormData) {
  const user = await getCurrentUser();

  if (!user || user.role !== "school_owner") {
    throw new Error("Unauthorized");
  }

  const schoolId = formData.get("school_id");
  const confirmName = formData.get("confirm_name");

  if (typeof schoolId !== "string" || !schoolId) {
    throw new Error("教室IDが見つかりません。");
  }

  if (typeof confirmName !== "string" || !confirmName.trim()) {
    throw new Error("確認用の教室名を入力してください。");
  }

  const supabase = createServiceClient();
  const { data: school, error: schoolError } = await supabase
    .from("schools")
    .select("id, name")
    .eq("id", schoolId)
    .eq("owner_id", user.id)
    .is("deleted_at", null)
    .single();

  if (schoolError) {
    throw new Error(schoolError.message);
  }

  if (!school) {
    throw new Error("削除する教室が見つかりません。");
  }

  if (school.name !== confirmName.trim()) {
    throw new Error("教室名が一致しません。");
  }

  const now = new Date().toISOString();

  const [
    schoolUpdate,
    areaUpdate,
    locationUpdate,
    studentUpdate,
    reservationDelete,
    teacherDelete,
    invitationDelete,
  ] = await Promise.all([
    supabase
      .from("schools")
      .update({ deleted_at: now })
      .eq("id", schoolId)
      .eq("owner_id", user.id)
      .is("deleted_at", null),
    supabase
      .from("areas")
      .update({ deleted_at: now })
      .eq("school_id", schoolId)
      .is("deleted_at", null),
    supabase
      .from("locations")
      .update({ deleted_at: now })
      .eq("school_id", schoolId)
      .is("deleted_at", null),
    supabase
      .from("students")
      .update({ deleted_at: now })
      .eq("school_id", schoolId)
      .is("deleted_at", null),
    supabase.from("reservations").delete().eq("school_id", schoolId),
    supabase.from("school_teachers").delete().eq("school_id", schoolId),
    supabase.from("invitations").delete().eq("school_id", schoolId),
  ]);

  for (const result of [
    schoolUpdate,
    areaUpdate,
    locationUpdate,
    studentUpdate,
    reservationDelete,
    teacherDelete,
    invitationDelete,
  ]) {
    if (result.error) {
      throw new Error(result.error.message);
    }
  }

  revalidatePath("/schools");
  redirect("/schools");
}

export async function removeTeacherMembershipAction(formData: FormData) {
  const user = await getCurrentUser();

  if (!user || user.role !== "school_owner") {
    throw new Error("Unauthorized");
  }

  const schoolId = formData.get("school_id");
  const membershipId = formData.get("membership_id");

  if (typeof schoolId !== "string" || !schoolId) {
    throw new Error("教室IDが見つかりません。");
  }

  if (typeof membershipId !== "string" || !membershipId) {
    throw new Error("所属情報が見つかりません。");
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
    .from("school_teachers")
    .delete()
    .eq("id", membershipId)
    .eq("school_id", schoolId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/schools/${schoolId}/teachers`);
  revalidatePath(`/schools/${schoolId}`);
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
