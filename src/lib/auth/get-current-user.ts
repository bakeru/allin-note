import { createClient } from "@/lib/supabase/server";

export type CurrentUser = {
  id: string;
  email: string;
  role: "teacher" | "student";
  display_name: string;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  // フェーズ1: モック認証
  if (process.env.NEXT_PUBLIC_USE_MOCK_AUTH === "true") {
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

    return {
      id:
        process.env.MOCK_USER_ID ??
        "00000000-0000-0000-0000-000000000001",
      email: "dev@example.com",
      role: "teacher",
      display_name: "開発用講師",
    };
  }

  // フェーズ2: 本物のSupabase Auth
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, display_name, email")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return {
    id: user.id,
    email: profile.email,
    role: profile.role,
    display_name: profile.display_name,
  };
}
