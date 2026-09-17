"use client";

import type { TournamentRecord } from "@/types/tournament";
import { CalendarDays, MapPin, Trophy } from "lucide-react";
import Link from "next/link";

interface TournamentListProps {
  tournaments: TournamentRecord[];
}

export function TournamentList({ tournaments }: TournamentListProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {tournaments.map((tournament) => (
        <Link key={tournament.id} href={`/tournaments/${tournament.id}`} className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5">
          <div className="relative h-28 bg-gradient-to-r from-emerald-500 to-teal-500">
            {tournament.bannerUrl ? <img src={tournament.bannerUrl} alt={`${tournament.name} banner`} className="h-full w-full object-cover" /> : null}
            {tournament.logoUrl ? <div className="absolute inset-0 flex items-center justify-center"><div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border-2 border-white bg-white/90 p-1 shadow-lg"><img src={tournament.logoUrl} alt={`${tournament.name} logo`} className="h-full w-full object-contain" /></div></div> : null}
          </div>
          <div className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
                <Trophy size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-900">{tournament.name}</h3>
                <p className="text-sm text-zinc-500">{tournament.type}</p>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-sm text-zinc-600">
              <div className="flex items-center gap-2"><MapPin size={16} />{tournament.city}</div>
              <div className="flex items-center gap-2"><CalendarDays size={16} />{tournament.startDate ? new Date(tournament.startDate).toLocaleDateString() : "TBD"}</div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">{tournament.status}</span>
              <span className="text-sm font-medium text-emerald-600">Open workspace</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
