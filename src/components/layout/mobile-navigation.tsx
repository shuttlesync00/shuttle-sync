"use client";

import { ClipboardList, Ellipsis, Home, Swords, Trophy, Users } from "lucide-react";
import Link from "next/link";

interface MobileNavigationProps {
  currentPath: string;
  onMoreClick: () => void;
}

const items = [
  { label: "Home", path: "/dashboard", icon: Home },
  { label: "Start Match", path: "/start-match", icon: Swords },
  { label: "Matches", path: "/matches", icon: ClipboardList },
  { label: "Tournaments", path: "/tournaments", icon: Trophy },
  { label: "Players", path: "/players", icon: Users },
];

export function MobileNavigation({ currentPath, onMoreClick }: MobileNavigationProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/95 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-5xl items-center justify-around px-2 py-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active = currentPath === item.path;
          return (
            <Link key={item.path} href={item.path} className={`flex flex-1 flex-col items-center rounded-2xl px-2 py-2 text-[11px] font-medium ${active ? "text-emerald-600" : "text-zinc-500"}`}>
              <Icon size={18} />
              <span className="mt-1">{item.label}</span>
            </Link>
          );
        })}
        <button type="button" onClick={onMoreClick} aria-label="More navigation" className="flex flex-1 flex-col items-center rounded-2xl px-2 py-2 text-[11px] font-medium text-zinc-500">
          <Ellipsis size={18} />
          <span className="mt-1">More</span>
        </button>
      </div>
    </nav>
  );
}
