"use client";

import { SidebarItem } from "@/components/layout/sidebar-item";
import { signOut } from "@/services/auth-service";
import { useAuthStore } from "@/store/auth-store";
import { BarChart3, ChevronLeft, ChevronRight, ClipboardList, Home, LogOut, Swords, Trophy, UserCircle, Users } from "lucide-react";
import { useRouter } from "next/navigation";

interface SidebarProps {
  currentPath: string;
  onNavigate?: (path: string) => void;
  mobile?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const items = [
  { label: "Home", path: "/dashboard", icon: Home },
  { label: "Start Match", path: "/start-match", icon: Swords },
  { label: "Matches Played", path: "/matches", icon: ClipboardList },
  { label: "Tournaments", path: "/tournaments", icon: Trophy },
  { label: "Points Table", path: "/points-table", icon: BarChart3 },
  { label: "Players", path: "/players", icon: Users },
  { label: "Profile", path: "/profile", icon: UserCircle },
];

export function Sidebar({ currentPath, onNavigate, mobile = false, collapsed = false, onToggleCollapse }: SidebarProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  async function handleLogout() {
    await signOut();
    router.push("/login");
  }

  return (
    <aside className={`${mobile ? "flex h-full w-full" : `hidden h-screen lg:flex ${collapsed ? "w-[76px]" : "w-[280px]"}`} flex-col border-r border-zinc-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.05)] transition-[width] duration-200`}>
      <div className={`border-b border-zinc-200 p-4 ${collapsed && !mobile ? "flex flex-col items-center gap-3" : "p-6"}`}>
        <div className={`flex items-center gap-3 ${collapsed && !mobile ? "justify-center" : ""}`}>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-lg font-semibold text-emerald-600">SS</div>
          {!collapsed || mobile ? <div>
            <p className="text-base font-semibold text-zinc-900">Shuttle Sync</p>
            <p className="text-sm text-zinc-500">Badminton Management Platform</p>
          </div> : null}
        </div>
        {!mobile ? (
          <button type="button" aria-label={collapsed ? "Show navigation" : "Hide navigation"} title={collapsed ? "Show navigation" : "Hide navigation"} onClick={onToggleCollapse} className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900">
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        ) : null}
      </div>

      <nav className={`flex-1 space-y-1 ${collapsed && !mobile ? "p-2" : "p-4"}`}>
        {items.map((item) => (
          <SidebarItem key={item.path} icon={item.icon} label={item.label} path={item.path} active={currentPath === item.path} collapsed={collapsed && !mobile} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className={`border-t border-zinc-200 ${collapsed && !mobile ? "p-2" : "p-4"}`}>
        <div className={`flex items-center gap-3 rounded-2xl bg-zinc-50 p-3 ${collapsed && !mobile ? "justify-center" : ""}`}>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-sm font-semibold text-emerald-600">
            {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
          </div>
          {!collapsed || mobile ? <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-zinc-900">{user?.name ?? "User"}</p>
            <p className="truncate text-xs text-zinc-500">{user?.email ?? ""}</p>
          </div> : null}
        </div>
        <button aria-label="Logout" title="Logout" onClick={handleLogout} className={`mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 ${collapsed && !mobile ? "px-2" : ""}`}>
          <LogOut size={16} />
          {!collapsed || mobile ? "Logout" : null}
        </button>
      </div>
    </aside>
  );
}
