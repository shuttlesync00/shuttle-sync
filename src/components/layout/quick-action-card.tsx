"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";

interface QuickActionCardProps {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

export function QuickActionCard({ title, description, href, icon: Icon }: QuickActionCardProps) {
  return (
    <Link href={href} className="rounded-[24px] border border-zinc-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
          <Icon size={20} />
        </div>
        <div>
          <p className="text-base font-semibold text-zinc-900">{title}</p>
          <p className="text-sm text-zinc-500">{description}</p>
        </div>
      </div>
    </Link>
  );
}
