import { createServerSupabaseClient } from "@/lib/supabase/auth";

export const createClient = async () => createServerSupabaseClient();
