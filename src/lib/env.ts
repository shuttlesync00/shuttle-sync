export const REQUIRED_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DATABASE_URL",
];

export function getSupabaseAnonKey(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    ""
  );
}

export function getMissingEnv(): string[] {
  const missing = REQUIRED_ENV.filter((k) => !process.env[k] || process.env[k]?.trim() === "");
  const anonKey = getSupabaseAnonKey();

  if (!anonKey) {
    missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  }

  return missing.filter((item, index, array) => array.indexOf(item) === index);
}

export function ensureEnv(): { ok: true } | { ok: false; missing: string[] } {
  const missing = getMissingEnv();
  if (missing.length > 0) return { ok: false, missing };
  return { ok: true };
}
