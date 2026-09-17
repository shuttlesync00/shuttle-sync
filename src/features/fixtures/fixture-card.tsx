"use client";

import type { FixtureRecord } from "@/types/fixture";
import type { TeamRecord } from "@/types/team";
import { CalendarDays, MapPin, ShieldCheck } from "lucide-react";

interface FixtureCardProps {
  fixture: FixtureRecord;
  teamA: TeamRecord | undefined;
  teamB: TeamRecord | undefined;
  onStart: () => void;
  onContinue?: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function FixtureCard({ fixture, teamA, teamB, onStart, onContinue, onEdit, onDelete }: FixtureCardProps) {
  return (
    <div className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-[0_14px_35px_rgba(15,23,42,0.05)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-emerald-600">Match {fixture.matchNumber}</p>
          <h3 className="mt-2 text-xl font-semibold text-zinc-900">{fixture.category.replace("_", " ")}</h3>
        </div>
        <span className="rounded-full bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700">{fixture.status}</span>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl bg-zinc-50 p-4">
          <p className="text-sm text-zinc-500">Team A</p>
          <p className="mt-2 font-medium text-zinc-900">{teamA?.name ?? "Unknown"}</p>
        </div>
        <div className="rounded-3xl bg-zinc-50 p-4">
          <p className="text-sm text-zinc-500 text-center">VS</p>
          <p className="mt-2 text-center text-lg font-semibold text-zinc-900">{teamA && teamB ? "Battle" : "Pending"}</p>
        </div>
        <div className="rounded-3xl bg-zinc-50 p-4">
          <p className="text-sm text-zinc-500">Team B</p>
          <p className="mt-2 font-medium text-zinc-900">{teamB?.name ?? "Unknown"}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-3xl bg-zinc-50 p-4">
          <div className="flex items-center gap-2 text-sm text-zinc-500"><CalendarDays size={16} />Date</div>
          <p className="mt-2 font-medium text-zinc-900">{fixture.date}</p>
        </div>
        <div className="rounded-3xl bg-zinc-50 p-4">
          <div className="flex items-center gap-2 text-sm text-zinc-500"><MapPin size={16} />Time</div>
          <p className="mt-2 font-medium text-zinc-900">{fixture.time}</p>
        </div>
        <div className="rounded-3xl bg-zinc-50 p-4">
          <div className="flex items-center gap-2 text-sm text-zinc-500"><ShieldCheck size={16} />Court</div>
          <p className="mt-2 font-medium text-zinc-900">{fixture.court ?? "TBD"}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" onClick={onStart} disabled={fixture.status !== "SCHEDULED"} className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50">{fixture.status === "LIVE" ? "Live" : fixture.status === "COMPLETED" ? "Completed" : "Start Match"}</button>
        {onContinue ? <button type="button" onClick={onContinue} className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100">Continue</button> : null}
        <button type="button" onClick={onEdit} disabled={fixture.status !== "SCHEDULED"} className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50">Edit</button>
        <button type="button" onClick={onDelete} disabled={fixture.status !== "SCHEDULED"} className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50">Delete</button>
      </div>
    </div>
  );
}
