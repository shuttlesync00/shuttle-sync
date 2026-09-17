import type { AuthUser } from "@/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  authHydrated: boolean;
  setUser: (user: AuthUser | null) => void;
  clearUser: () => void;
  setAuthHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      authHydrated: false,
      setUser: (user) => set({ user, isAuthenticated: Boolean(user), authHydrated: true }),
      clearUser: () => set({ user: null, isAuthenticated: false, authHydrated: true }),
      setAuthHydrated: (value) => set({ authHydrated: value }),
    }),
    {
      name: "shuttle-sync-auth",
    },
  ),
);
