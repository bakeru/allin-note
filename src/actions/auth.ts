"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getHomePathForRole } from "@/lib/auth/navigation";
import { sendEmail } from "@/lib/email/send";
import { studentInvitationEmail } from "@/lib/email/templates/student-invitation";
import { teacherInvitationEmail } from "@/lib/email/templates/teacher-invitation";
import { createServerSupabaseClient } from "@/lib/supabase/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { buildAppUrl } from "@/lib/utils/app-url";

type InvitationRole = "teacher" | "student";
type TeacherSchoolRole = "owner" | "head_teacher" | "teacher";

const ensureProductionAuth = () => {
  if (
    process.env.NEXT_PUBLIC_AUTH_MODE === "mock" ||
    process.env.NEXT_PUBLIC_USE_MOCK_AUTH === "true"
  ) {
    throw new Error("本番認証モードに切り替えてから実行してください。");
  }
};

const normalizeInvitationStatus = (expiresAt: string, status: string) => {
  if (status !== "pending") {
    return status;
  }

  return new Date(expiresAt).getTime() < Date.now() ? "expired" : "pending";
};

async function ensureInvitationIsAcceptable(token: string) {
  const supabase = createServiceClient();
  const { data: invitation, error } = await supabase
    .from("invitations")
    .select(
      `
        id,
        school_id,
        email,
        role,
        invited_by,
        token,
        expires_at,
        status,
        accepted_at,
        accepted_by,
        teacher_role,
        student_name,
        student_teacher_id,
        default_location_id,
        school:schools!invitations_school_id_fkey(
          id,
          name,
          owner_id
        ),
        inviter:profiles!invitations_invited_by_fkey(
          display_name
        )
      `
    )
    .eq("token", token)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (!invitation) {
    throw new Error("招待が見つかりません。");
  }

  const normalizedStatus = normalizeInvitationStatus(
    invitation.expires_at,
    invitation.status
  );

  if (normalizedStatus === "expired") {
    if (invitation.status !== "expired") {
      await supabase
        .from("invitations")
        .update({ status: "expired" })
        .eq("id", invitation.id);
    }
    throw new Error("招待の有効期限が切れています。");
  }

  if (normalizedStatus !== "pending") {
    throw new Error("この招待はすでに使用されています。");
  }

  return invitation;
}

async function createProfileForUser(params: {
  userId: string;
  email: string;
  displayName: string;
  role: "school_owner" | "teacher" | "student";
}) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("profiles").insert({
    id: params.userId,
    email: params.email,
    role: params.role,
    display_name: params.displayName,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function signUpAction(formData: FormData) {
  ensureProductionAuth();

  const email = formData.get("email");
  const password = formData.get("password");
  const displayName = formData.get("display_name");
  const role = formData.get("role");

  if (typeof email !== "string" || !email.trim()) {
    throw new Error("メールアドレスを入力してください。");
  }

  if (typeof password !== "string" || password.length < 8) {
    throw new Error("パスワードは8文字以上で入力してください。");
  }

  if (typeof displayName !== "string" || !displayName.trim()) {
    throw new Error("お名前を入力してください。");
  }

  if (
    role !== "school_owner" &&
    role !== "teacher" &&
    role !== "student"
  ) {
    throw new Error("ロールを選択してください。");
  }

  if (role !== "school_owner") {
    throw new Error("講師・生徒は招待リンクから登録してください。");
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user?.id || !data.user.email) {
    throw new Error("ユーザー作成に失敗しました。");
  }

  await createProfileForUser({
    userId: data.user.id,
    email: data.user.email,
    displayName: displayName.trim(),
    role: "school_owner",
  });

  revalidatePath("/schools");
  redirect("/schools");
}

export async function signInAction(formData: FormData) {
  ensureProductionAuth();

  const email = formData.get("email");
  const password = formData.get("password");
  const redirectTo = formData.get("redirect_to");

  if (typeof email !== "string" || !email.trim()) {
    throw new Error("メールアドレスを入力してください。");
  }

  if (typeof password !== "string" || !password) {
    throw new Error("パスワードを入力してください。");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (typeof redirectTo === "string" && redirectTo.startsWith("/")) {
    redirect(redirectTo);
  }

  const user = await getCurrentUser();

  if (!user) {
    redirect("/");
  }

  redirect(getHomePathForRole(user.role));
}

export async function signOutAction() {
  if (
    process.env.NEXT_PUBLIC_AUTH_MODE === "mock" ||
    process.env.NEXT_PUBLIC_USE_MOCK_AUTH === "true"
  ) {
    redirect("/");
  }

  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function createInvitationAction(formData: FormData) {
  const user = await getCurrentUser();

  if (!user || user.role !== "school_owner") {
    throw new Error("Unauthorized");
  }

  const schoolId = formData.get("school_id");
  const email = formData.get("email");
  const role = formData.get("role");
  const teacherRole = formData.get("teacher_role");
  const studentName = formData.get("student_name");
  const studentTeacherId = formData.get("student_teacher_id");
  const defaultLocationId = formData.get("default_location_id");

  if (typeof schoolId !== "string" || !schoolId) {
    throw new Error("教室IDが見つかりません。");
  }

  if (typeof email !== "string" || !email.trim()) {
    throw new Error("メールアドレスを入力してください。");
  }

  if (role !== "teacher" && role !== "student") {
    throw new Error("招待タイプを選択してください。");
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
    throw new Error("この教室には招待を作成できません。");
  }

  const insertPayload: {
    school_id: string;
    email: string;
    role: InvitationRole;
    invited_by: string;
    teacher_role?: TeacherSchoolRole | null;
    student_name?: string | null;
    student_teacher_id?: string | null;
    default_location_id?: string | null;
  } = {
    school_id: schoolId,
    email: email.trim(),
    role,
    invited_by: user.id,
  };

  if (role === "teacher") {
    insertPayload.teacher_role =
      teacherRole === "owner" ||
      teacherRole === "head_teacher" ||
      teacherRole === "teacher"
        ? teacherRole
        : "teacher";
  } else {
    if (typeof studentTeacherId !== "string" || !studentTeacherId) {
      throw new Error("生徒招待では担当講師を選択してください。");
    }

    insertPayload.student_name =
      typeof studentName === "string" && studentName.trim()
        ? studentName.trim()
        : null;
    insertPayload.student_teacher_id = studentTeacherId;
    insertPayload.default_location_id =
      typeof defaultLocationId === "string" && defaultLocationId
        ? defaultLocationId
        : null;
  }

  const { data: invitation, error } = await supabase
    .from("invitations")
    .insert(insertPayload)
    .select("token, role, email, expires_at, student_name")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const invitationUrl = buildAppUrl(`/invite/${invitation.token}`);
  const expiresAt = new Date(invitation.expires_at);

  if (invitation.role === "teacher") {
    const { subject, html } = teacherInvitationEmail({
      schoolName: school.name,
      inviterName: user.display_name,
      invitationUrl,
      expiresAt,
    });

    await sendEmail({
      to: invitation.email,
      subject,
      html,
    });
  } else {
    const { subject, html } = studentInvitationEmail({
      schoolName: school.name,
      inviterName: user.display_name,
      invitationUrl,
      expiresAt,
      studentName: invitation.student_name,
    });

    await sendEmail({
      to: invitation.email,
      subject,
      html,
    });
  }

  revalidatePath(`/schools/${schoolId}/invitations`);
  redirect(`/schools/${schoolId}/invitations?created=${invitation.token}`);
}

export async function cancelInvitationAction(formData: FormData) {
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
  const { error } = await supabase
    .from("invitations")
    .update({ status: "cancelled" })
    .eq("id", invitationId)
    .eq("school_id", schoolId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/schools/${schoolId}/invitations`);
}

export async function acceptInvitationAction(formData: FormData) {
  ensureProductionAuth();

  const token = formData.get("token");
  const displayName = formData.get("display_name");
  const password = formData.get("password");

  if (typeof token !== "string" || !token) {
    throw new Error("招待トークンが見つかりません。");
  }

  const invitation = await ensureInvitationIsAcceptable(token);
  const existingUser = await getCurrentUser();
  const school = Array.isArray(invitation.school)
    ? invitation.school[0]
    : invitation.school;

  let acceptedUserId = existingUser?.id;
  let acceptedEmail = existingUser?.email ?? invitation.email;

  if (!existingUser) {
    if (typeof password !== "string" || password.length < 8) {
      throw new Error("パスワードは8文字以上で入力してください。");
    }

    if (typeof displayName !== "string" || !displayName.trim()) {
      throw new Error("お名前を入力してください。");
    }

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.signUp({
      email: invitation.email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user?.id || !data.user.email) {
      throw new Error("ユーザー作成に失敗しました。");
    }

    acceptedUserId = data.user.id;
    acceptedEmail = data.user.email;

    await createProfileForUser({
      userId: acceptedUserId,
      email: acceptedEmail,
      displayName: displayName.trim(),
      role: invitation.role as "teacher" | "student",
    });
  } else {
    if (existingUser.email !== invitation.email) {
      throw new Error("招待されたメールアドレスのアカウントでログインしてください。");
    }

    if (
      (invitation.role === "teacher" &&
        existingUser.role !== "teacher" &&
        existingUser.role !== "school_owner") ||
      (invitation.role === "student" && existingUser.role !== "student")
    ) {
      throw new Error("この招待は現在のアカウントでは受け取れません。");
    }
  }

  if (!acceptedUserId || !school) {
    throw new Error("招待の処理に失敗しました。");
  }

  const service = createServiceClient();
  const targetRole =
    existingUser?.role ?? (invitation.role as "teacher" | "student");

  if (invitation.role === "teacher") {
    const { error: teacherError } = await service.from("school_teachers").upsert({
      school_id: invitation.school_id,
      teacher_id: acceptedUserId,
      role:
        invitation.teacher_role === "owner" ||
        invitation.teacher_role === "head_teacher" ||
        invitation.teacher_role === "teacher"
          ? invitation.teacher_role
          : "teacher",
    });

    if (teacherError) {
      throw new Error(teacherError.message);
    }
  } else {
    const { error: studentError } = await service.from("students").upsert({
      user_id: acceptedUserId,
      teacher_id: invitation.student_teacher_id,
      school_id: invitation.school_id,
      start_date: new Date().toISOString().slice(0, 10),
      status: "active",
      notes: null,
      default_location_id: invitation.default_location_id,
      deleted_at: null,
    });

    if (studentError) {
      throw new Error(studentError.message);
    }
  }

  const { error: invitationError } = await service
    .from("invitations")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
      accepted_by: acceptedUserId,
    })
    .eq("id", invitation.id);

  if (invitationError) {
    throw new Error(invitationError.message);
  }

  revalidatePath(`/schools/${invitation.school_id}/invitations`);
  redirect(getHomePathForRole(targetRole));
}
