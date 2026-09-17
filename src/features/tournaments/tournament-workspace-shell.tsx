"use client";

import { TournamentBrandingEditor } from "@/features/tournaments/tournament-branding-editor";
import { TournamentDeleteButton } from "@/features/tournaments/tournament-delete-button";
import { TournamentEndButton } from "@/features/tournaments/tournament-end-button";
import type { TournamentRecord } from "@/types/tournament";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface TournamentWorkspaceShellProps {
  tournament: TournamentRecord;
  activeTab?: "overview" | "teams" | "matches" | "more";
  children: React.ReactNode;
}

export function TournamentWorkspaceShell({ tournament, activeTab, children }: TournamentWorkspaceShellProps) {
  const tournamentId = tournament.id;
  const pathname = usePathname();
  const currentTab = pathname.endsWith("/teams") ? "teams" : pathname.endsWith("/matches") ? "matches" : pathname === `/tournaments/${tournamentId}` ? "overview" : activeTab ?? "more";
  const tabs = [
    { label: "Overview", href: `/tournaments/${tournamentId}`, active: currentTab === "overview" },
    { label: "Teams", href: `/tournaments/${tournamentId}/teams`, active: currentTab === "teams" },
    { label: "Matches", href: `/tournaments/${tournamentId}/matches`, active: currentTab === "matches" },
  ];
  const moreLinks = [
    { label: "Results", href: `/tournaments/${tournamentId}/results` },
    { label: "Standings", href: `/tournaments/${tournamentId}/standings` },
    { label: "Statistics", href: `/tournaments/${tournamentId}/statistics` },
    { label: "Settings", href: `/tournaments/${tournamentId}/settings` },
  ];

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[32px] border border-zinc-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
        <div className="relative h-[180px] overflow-hidden rounded-t-[32px] bg-gradient-to-r from-emerald-500 to-teal-500 sm:h-[220px] lg:h-[260px]">
          {tournament.bannerUrl ? <img src={tournament.bannerUrl} alt={`${tournament.name} banner`} className="h-full w-full rounded-t-[32px] object-cover" /> : null}
          <div className="absolute inset-0 bg-black/5" />
          <div className="absolute left-1/2 top-1/2 z-10 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.2)] sm:h-28 sm:w-28 sm:p-5 lg:h-36 lg:w-36 lg:p-5">
            {tournament.logoUrl ? <img src={tournament.logoUrl} alt={`${tournament.name} logo`} className="h-full w-full object-contain" /> : <span className="text-center text-xs font-semibold uppercase tracking-[0.15em] text-emerald-700">Logo</span>}
          </div>
        </div>
        <div className="px-6 py-5 sm:px-8 sm:py-6">
          <div className="grid items-center gap-4 lg:grid-cols-2 lg:gap-10">
            <div className="min-w-0">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-600">Tournament Workspace</p>
              <h1 className="mt-1 text-2xl font-semibold text-zinc-900 sm:text-3xl">{tournament.name}</h1>
            </div>
            <div className="min-w-0 text-sm text-zinc-500 lg:text-right">
              <p>{tournament.city || "Location not set"} <span className="hidden sm:inline">•</span> {tournament.ground || "Venue not set"}</p>
              <p className="mt-1">{tournament.startDate ? new Date(tournament.startDate).toLocaleDateString() : "Date TBD"}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 border-t border-zinc-100 pt-4 lg:justify-end">
            <TournamentBrandingEditor tournamentId={tournamentId} hasBanner={Boolean(tournament.bannerUrl)} hasLogo={Boolean(tournament.logoUrl)} />
            <div className="rounded-full bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-700">{tournament.status}</div>
            {tournament.status !== "COMPLETED" ? <TournamentEndButton tournamentId={tournamentId} /> : null}
            <TournamentDeleteButton tournamentId={tournamentId} />
          </div>
        </div>
      </div>

      <nav className="flex gap-2 overflow-x-auto rounded-[24px] border border-zinc-200 bg-white p-3 shadow-[0_16px_40px_rgba(15,23,42,0.05)]" aria-label="Tournament navigation">
        {tabs.map((tab) => <Link key={tab.href} href={tab.href} aria-current={tab.active ? "page" : undefined} className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${tab.active ? "bg-emerald-500 text-white" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"}`}>{tab.label}</Link>)}
        <details className="relative ml-auto shrink-0 rounded-full">
          <summary className="cursor-pointer rounded-full px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900">More ▼</summary>
          <div className="absolute right-0 z-20 mt-2 w-44 rounded-3xl border border-zinc-200 bg-white p-3 shadow-xl">{moreLinks.map((link) => <Link key={link.href} href={link.href} className="block rounded-2xl px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-50">{link.label}</Link>)}</div>
        </details>
      </nav>

      <div>{children}</div>
    </div>
  );
}
