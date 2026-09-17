"use client";

import { signOut } from "@/services/auth-service";
import { useAuthStore } from "@/store/auth-store";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export function ProfileCard() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  async function handleLogout() {
    await signOut();
    router.push("/login");
  }

  return (
    <div className="rounded-[24px] border border-zinc-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-lg font-semibold text-emerald-600">
          {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
        </div>
        <div>
          <p className="text-base font-semibold text-zinc-900">{user?.name ?? "User"}</p>
          <p className="text-sm text-zinc-500">{user?.email ?? ""}</p>
        </div>
      </div>
      <button onClick={handleLogout} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50">
        <LogOut size={16} />
        Logout
      </button>
    </div>
  );
}
