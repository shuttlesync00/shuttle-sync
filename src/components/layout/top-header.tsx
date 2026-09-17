"use client";

import { useAuthStore } from "@/store/auth-store";
import { Bell, ChevronRight, Menu } from "lucide-react";
import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface TopHeaderProps {
  title: string;
  breadcrumbs?: BreadcrumbItem[];
  onMenuClick?: () => void;
}

export function TopHeader({ title, breadcrumbs = [], onMenuClick }: TopHeaderProps) {
  const user = useAuthStore((state) => state.user);

  return (
    <header className="border-b border-zinc-200 bg-white/80 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <button aria-label="Open navigation" onClick={onMenuClick} className="rounded-full p-2 text-zinc-700 hover:bg-zinc-100 lg:hidden">
            <Menu size={20} />
          </button>

          <div className="min-w-0">
            {breadcrumbs.length > 0 ? (
              <nav aria-label="Breadcrumb" className="mb-1 flex min-w-0 items-center gap-1 overflow-hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
                {breadcrumbs.map((crumb, index) => (
                  <div key={`${crumb.href}-${index}`} className="flex min-w-0 items-center gap-1">
                    {index > 0 ? <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-300" /> : null}
                    {index === breadcrumbs.length - 1 ? (
                      <span className="truncate text-zinc-500">{crumb.label}</span>
                    ) : (
                      <Link href={crumb.href} className="truncate text-zinc-400 transition hover:text-zinc-700">{crumb.label}</Link>
                    )}
                  </div>
                ))}
              </nav>
            ) : null}

            <p className="truncate text-sm font-semibold text-zinc-900">{title}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="rounded-full p-2 text-zinc-700 hover:bg-zinc-100">
            <Bell size={18} />
          </button>
          <div className="flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-2 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-sm font-semibold text-emerald-600">
              {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-zinc-900">{user?.name ?? "User"}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
