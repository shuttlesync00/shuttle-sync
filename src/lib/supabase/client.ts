import { getSupabaseAnonKey } from "@/lib/env";
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const anonKey = getSupabaseAnonKey();

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !anonKey) {
    throw new Error("Supabase public configuration is incomplete. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
  }

  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL, anonKey);
}
