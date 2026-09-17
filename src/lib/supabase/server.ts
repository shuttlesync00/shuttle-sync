import { getSupabaseAnonKey } from "@/lib/env";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  const anonKey = getSupabaseAnonKey();

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !anonKey) {
    throw new Error("Supabase public configuration is incomplete. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
  }

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // The server component cannot set cookies directly.
        }
      },
    },
  });
}

export const getUser = cache(async () => {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
});
