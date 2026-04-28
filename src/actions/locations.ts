"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/get-current-user";
import { createServiceClient } from "@/lib/supabase/service";

const ensureSchoolOwner = async () => {
  const user = await getCurrentUser();

  if (!user || user.role !== "school_owner") {
    throw new Error("Unauthorized");
  }

  return user;
};

const ensureSchoolOwnership = async (schoolId: string, ownerId: string) => {
  const supabase = createServiceClient();
  const { data: school, error } = await supabase
    .from("schools")
    .select("id")
    .eq("id", schoolId)
    .eq("owner_id", ownerId)
    .is("deleted_at", null)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (!school) {
    throw new Error("Forbidden");
  }

  return supabase;
};

export async function createAreaAction(formData: FormData) {
  const user = await ensureSchoolOwner();
  const schoolId = formData.get("school_id");
  const name = formData.get("name");

  if (typeof schoolId !== "string" || !schoolId) {
    throw new Error("教室IDが見つかりません。");
  }

  if (typeof name !== "string" || !name.trim()) {
    throw new Error("エリア名を入力してください。");
  }

  const supabase = await ensureSchoolOwnership(schoolId, user.id);
  const { error } = await supabase.from("areas").insert({
    school_id: schoolId,
    name: name.trim(),
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/schools/${schoolId}`);
  redirect(`/schools/${schoolId}`);
}

export async function updateAreaAction(formData: FormData) {
  const user = await ensureSchoolOwner();
  const schoolId = formData.get("school_id");
  const areaId = formData.get("area_id");
  const name = formData.get("name");

  if (
    typeof schoolId !== "string" ||
    !schoolId ||
    typeof areaId !== "string" ||
    !areaId
  ) {
    throw new Error("エリア情報が不足しています。");
  }

  if (typeof name !== "string" || !name.trim()) {
    throw new Error("エリア名を入力してください。");
  }

  const supabase = await ensureSchoolOwnership(schoolId, user.id);
  const { error } = await supabase
    .from("areas")
    .update({ name: name.trim() })
    .eq("id", areaId)
    .eq("school_id", schoolId)
    .is("deleted_at", null);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/schools/${schoolId}`);
  redirect(`/schools/${schoolId}`);
}

export async function deleteAreaAction(formData: FormData) {
  const user = await ensureSchoolOwner();
  const schoolId = formData.get("school_id");
  const areaId = formData.get("area_id");

  if (
    typeof schoolId !== "string" ||
    !schoolId ||
    typeof areaId !== "string" ||
    !areaId
  ) {
    throw new Error("エリア情報が不足しています。");
  }

  const supabase = await ensureSchoolOwnership(schoolId, user.id);
  const { error } = await supabase
    .from("areas")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", areaId)
    .eq("school_id", schoolId)
    .is("deleted_at", null);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/schools/${schoolId}`);
}

export async function createLocationAction(formData: FormData) {
  const user = await ensureSchoolOwner();
  const schoolId = formData.get("school_id");
  const name = formData.get("name");
  const type = formData.get("type");
  const areaId = formData.get("area_id");
  const notes = formData.get("notes");

  if (typeof schoolId !== "string" || !schoolId) {
    throw new Error("教室IDが見つかりません。");
  }

  if (typeof name !== "string" || !name.trim()) {
    throw new Error("場所名を入力してください。");
  }

  const validTypes = new Set(["room", "home_visit", "external"]);
  if (typeof type !== "string" || !validTypes.has(type)) {
    throw new Error("場所タイプが不正です。");
  }

  const supabase = await ensureSchoolOwnership(schoolId, user.id);
  const { error } = await supabase.from("locations").insert({
    school_id: schoolId,
    name: name.trim(),
    type,
    area_id: typeof areaId === "string" && areaId ? areaId : null,
    notes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/schools/${schoolId}`);
  redirect(`/schools/${schoolId}`);
}

export async function updateLocationAction(formData: FormData) {
  const user = await ensureSchoolOwner();
  const schoolId = formData.get("school_id");
  const locationId = formData.get("location_id");
  const name = formData.get("name");
  const type = formData.get("type");
  const areaId = formData.get("area_id");
  const notes = formData.get("notes");

  if (
    typeof schoolId !== "string" ||
    !schoolId ||
    typeof locationId !== "string" ||
    !locationId
  ) {
    throw new Error("場所情報が不足しています。");
  }

  if (typeof name !== "string" || !name.trim()) {
    throw new Error("場所名を入力してください。");
  }

  const validTypes = new Set(["room", "home_visit", "external"]);
  if (typeof type !== "string" || !validTypes.has(type)) {
    throw new Error("場所タイプが不正です。");
  }

  const supabase = await ensureSchoolOwnership(schoolId, user.id);
  const { error } = await supabase
    .from("locations")
    .update({
      name: name.trim(),
      type,
      area_id: typeof areaId === "string" && areaId ? areaId : null,
      notes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
    })
    .eq("id", locationId)
    .eq("school_id", schoolId)
    .is("deleted_at", null);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/schools/${schoolId}`);
  redirect(`/schools/${schoolId}`);
}

export async function deleteLocationAction(formData: FormData) {
  const user = await ensureSchoolOwner();
  const schoolId = formData.get("school_id");
  const locationId = formData.get("location_id");

  if (
    typeof schoolId !== "string" ||
    !schoolId ||
    typeof locationId !== "string" ||
    !locationId
  ) {
    throw new Error("場所情報が不足しています。");
  }

  const supabase = await ensureSchoolOwnership(schoolId, user.id);
  const { error } = await supabase
    .from("locations")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", locationId)
    .eq("school_id", schoolId)
    .is("deleted_at", null);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/schools/${schoolId}`);
}

export async function updateLocationSettingsAction(formData: FormData) {
  const user = await ensureSchoolOwner();
  const schoolId = formData.get("school_id");
  const locationManagementEnabled = formData.get("location_management_enabled");
  const sameLocation = formData.get("buffer_same_location_minutes");
  const sameArea = formData.get("buffer_same_area_minutes");
  const differentArea = formData.get("buffer_different_area_minutes");

  if (typeof schoolId !== "string" || !schoolId) {
    throw new Error("教室IDが見つかりません。");
  }

  const supabase = await ensureSchoolOwnership(schoolId, user.id);
  const { error } = await supabase
    .from("schools")
    .update({
      location_management_enabled: locationManagementEnabled === "on",
      buffer_same_location_minutes:
        typeof sameLocation === "string" ? Number.parseInt(sameLocation, 10) || 0 : 0,
      buffer_same_area_minutes:
        typeof sameArea === "string" ? Number.parseInt(sameArea, 10) || 0 : 0,
      buffer_different_area_minutes:
        typeof differentArea === "string"
          ? Number.parseInt(differentArea, 10) || 0
          : 0,
    })
    .eq("id", schoolId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/schools/${schoolId}`);
}

export async function updateCancellationPolicyAction(formData: FormData) {
  const user = await ensureSchoolOwner();
  const schoolId = formData.get("school_id");
  const deadline = formData.get("cancellation_deadline_hours");
  const policy = formData.get("late_cancellation_policy");

  if (typeof schoolId !== "string" || !schoolId) {
    throw new Error("教室IDが見つかりません。");
  }

  const validPolicies = new Set(["consume", "no_cancel"]);
  if (typeof policy !== "string" || !validPolicies.has(policy)) {
    throw new Error("キャンセルポリシーが不正です。");
  }

  const supabase = await ensureSchoolOwnership(schoolId, user.id);
  const { error } = await supabase
    .from("schools")
    .update({
      cancellation_deadline_hours:
        typeof deadline === "string" ? Number.parseInt(deadline, 10) || 24 : 24,
      late_cancellation_policy: policy,
    })
    .eq("id", schoolId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/schools/${schoolId}`);
}
