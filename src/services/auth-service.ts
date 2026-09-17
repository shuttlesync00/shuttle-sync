import { createClient } from "@/lib/supabase/client";

export async function signInWithEmail(email: string, password: string) {
  const supabase = createClient();
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail(email: string, password: string, name: string, phoneNumber?: string) {
  const supabase = createClient();
  return supabase.auth.signUp({ email, password, options: { data: { name, phoneNumber } } });
}

export async function resetPasswordEmail(email: string) {
  const supabase = createClient();
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/reset-password`,
  });
}

export async function updatePassword(password: string) {
  const supabase = createClient();
  return supabase.auth.updateUser({ password });
}

export async function uploadProfileImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch("/api/profile/avatar", { method: "POST", body: formData });
    const payload = await response.json().catch(() => null) as { url?: string; error?: string } | null;
    if (!response.ok || !payload?.url) {
      return { url: null, error: new Error(payload?.error ?? "Unable to upload profile photo.") };
    }

    return { url: payload.url, error: null };
  } catch (error) {
    return { url: null, error: error instanceof Error ? error : new Error("Unable to upload profile photo.") };
  }
}

export async function signOut() {
  const supabase = createClient();
  return supabase.auth.signOut();
}
