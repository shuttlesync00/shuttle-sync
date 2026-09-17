"use client";

import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/auth-store";
import { useEffect } from "react";

export function useAuth() {
  const { user, isAuthenticated, authHydrated, setUser, clearUser, setAuthHydrated } = useAuthStore();

  useEffect(() => {
    if (authHydrated) return undefined;

    const supabase = createClient();
    let mounted = true;

    const syncUser = (session: Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"]) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          name: session.user.user_metadata?.name ?? "User",
          email: session.user.email ?? "",
          phoneNumber: session.user.user_metadata?.phoneNumber ?? null,
          profileImage: session.user.user_metadata?.avatar_url ?? null,
          createdAt: session.user.created_at ?? new Date().toISOString(),
          updatedAt: session.user.updated_at ?? new Date().toISOString(),
        });
      } else {
        clearUser();
      }

      if (mounted) setAuthHydrated(true);
    };

    const loadUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      syncUser(session);
    };

    void loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      syncUser(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [authHydrated, clearUser, setAuthHydrated, setUser]);

  return {
    user,
    setUser,
    clearUser,
    isLoading: !authHydrated && !user && !isAuthenticated,
  };
}
