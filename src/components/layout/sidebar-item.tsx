"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  path: string;
  active?: boolean;
  onNavigate?: (path: string) => void;
  collapsed?: boolean;
}

export function SidebarItem({ icon: Icon, label, path, active = false, onNavigate, collapsed = false }: SidebarItemProps) {
  return (
    <Link
      href={path}
      onClick={() => onNavigate?.(path)}
      aria-label={collapsed ? label : undefined}
      title={collapsed ? label : undefined}
      className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition ${collapsed ? "justify-center" : ""} ${active ? "bg-emerald-500 text-white shadow-sm" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"}`}
    >
      <Icon size={18} />
      {!collapsed ? <span>{label}</span> : null}
    </Link>
  );
}
