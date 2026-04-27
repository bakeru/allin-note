import { createServerSupabaseClient } from "@/lib/supabase/auth";

export type CurrentUser = {
  id: string;
  email: string;
  role: "school_owner" | "teacher" | "student";
  display_name: string;
};

export function getMockUser(): CurrentUser {
  const mockRole = process.env.NEXT_PUBLIC_MOCK_ROLE || "teacher";

  if (mockRole === "student") {
    return {
      id:
        process.env.NEXT_PUBLIC_DEV_STUDENT_ID ??
        "00000000-0000-0000-0000-000000000002",
      email: "student@example.com",
      role: "student",
      display_name: "開発用生徒",
    };
  }

  if (mockRole === "school_owner") {
    return {
      id:
        process.env.NEXT_PUBLIC_MOCK_USER_ID ??
        process.env.MOCK_USER_ID ??
        "00000000-0000-0000-0000-000000000001",
      email: "dev@example.com",
      role: "school_owner",
      display_name: "開発用オーナー",
    };
  }

  return {
    id:
      process.env.NEXT_PUBLIC_MOCK_USER_ID ??
      process.env.MOCK_USER_ID ??
      "00000000-0000-0000-0000-000000000001",
    email: "dev@example.com",
    role: "teacher",
    display_name: "開発用講師",
  };
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (
    process.env.NEXT_PUBLIC_AUTH_MODE === "mock" ||
    process.env.NEXT_PUBLIC_USE_MOCK_AUTH === "true"
  ) {
    return getMockUser();
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, role, display_name")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return {
    id: profile.id,
    email: profile.email ?? user.email,
    role: profile.role,
    display_name: profile.display_name,
  };
}
