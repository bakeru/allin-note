import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const browserKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export function createAuthClient() {
  if (!supabaseUrl || !browserKey) {
    throw new Error("Supabase Auth用の環境変数が不足しています。");
  }

  return createBrowserClient(supabaseUrl, browserKey);
}

export async function createServerSupabaseClient() {
  if (!supabaseUrl || !browserKey) {
    throw new Error("Supabase Auth用の環境変数が不足しています。");
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, browserKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Component から呼ばれた場合は無視する
        }
      },
    },
  });
}
