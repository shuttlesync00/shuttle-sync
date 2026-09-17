"use client";

import type { AuthenticatedProfile, UserMatchSummary } from "@/services/profile-service";
import { ArrowLeft, BarChart3, Filter, MapPin } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

type FilterType = "all" | "tournament" | "one-off";

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleDateString();
}

export function BadmintonStatsClient({ profile, matches }: { profile: AuthenticatedProfile; matches: UserMatchSummary[] }) {
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("all");

  const filteredMatches = useMemo(() => {
    if (selectedFilter === "tournament") return matches.filter((match) => match.isTournament);
    if (selectedFilter === "one-off") return matches.filter((match) => !match.isTournament);
    return matches;
  }, [matches, selectedFilter]);

  const summary = useMemo(() => {
    const wins = filteredMatches.filter((match) => match.userWon === true).length;
    const losses = filteredMatches.filter((match) => match.userWon === false).length;
    const played = wins + losses;
    return {
      matches: played,
      wins,
      losses,
      winPercentage: played > 0 ? (wins / played) * 100 : 0,
      titles: 0,
    };
  }, [filteredMatches]);

  const safeName = profile.name || "User";
  const initials = safeName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "U";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/profile" className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 hover:text-zinc-900"><ArrowLeft className="h-4 w-4" /> Back to profile</Link>
          <p className="mt-5 text-sm font-medium uppercase tracking-[0.2em] text-emerald-600">Performance</p>
          <h1 className="mt-2 text-3xl font-semibold text-zinc-900">Badminton statistics</h1>
          <p className="mt-2 text-sm text-zinc-500">Calculated from completed matches involving your registered player.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700"><Filter className="h-4 w-4" /> {selectedFilter === "all" ? "All matches" : selectedFilter === "tournament" ? "Tournament" : "One-off"}</div>
      </div>

      <section className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)] sm:p-8">
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-emerald-500/10 text-xl font-semibold text-emerald-600">
            {profile.profileImage ? <img src={profile.profileImage} alt={safeName || "Profile"} className="h-full w-full object-cover" /> : initials}
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-zinc-900">{safeName}</h2>
            <div className="mt-2 flex items-center gap-2 text-sm text-zinc-500"><MapPin className="h-4 w-4" />{profile.city && profile.country ? `${profile.city}, ${profile.country}` : "Location not provided"}</div>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        {(["all", "tournament", "one-off"] as FilterType[]).map((filter) => (
          <button key={filter} type="button" onClick={() => setSelectedFilter(filter)} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${selectedFilter === filter ? "bg-emerald-500 text-white" : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"}`}>
            {filter === "all" ? "All" : filter === "tournament" ? "Tournament" : "One-off"}
          </button>
        ))}
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ["Matches", summary.matches],
          ["Wins", summary.wins],
          ["Losses", summary.losses],
          ["Win %", `${summary.winPercentage.toFixed(0)}%`],
          ["Titles", summary.titles],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]"><p className="text-sm text-zinc-500">{label}</p><p className="mt-3 text-3xl font-semibold text-zinc-900">{value}</p></div>
        ))}
      </section>

      <section className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)] sm:p-8">
        <div className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-emerald-600" /><h2 className="text-2xl font-semibold text-zinc-900">Recent matches</h2></div>
        <div className="mt-6 divide-y divide-zinc-100">
          {filteredMatches.length === 0 ? <p className="rounded-2xl bg-zinc-50 px-4 py-5 text-sm text-zinc-500">No matches played yet.</p> : filteredMatches.map((match) => (
            <div key={match.id} className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0"><p className="truncate font-semibold text-zinc-900">{match.homeName ?? "Unnamed side"} <span className="font-normal text-zinc-400">vs</span> {match.awayName ?? "Unnamed side"}</p><p className="mt-1 text-sm text-zinc-500">{match.tournamentName ?? "One-off match"} · {match.category?.replaceAll("_", " ") ?? "Match"} · {formatDate(match.playedAt)}</p></div>
              <div className="flex items-center gap-4 sm:text-right"><span className="font-semibold text-zinc-900">{match.scoreHome} - {match.scoreAway}</span><span className={`text-sm font-semibold ${match.userWon ? "text-emerald-600" : "text-red-600"}`}>{match.userWon ? "Win" : "Loss"}</span></div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
