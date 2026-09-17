import { getUser } from "@/lib/supabase/server";
import { countMatches, listRecentMatchesForDashboard } from "@/services/match-service";
import { getAuthenticatedProfile } from "@/services/profile-service";
import { countTeams } from "@/services/team-service";
import { getDashboardTournaments } from "@/services/tournament-service";
import { CalendarDays, MapPin, Plus, Trophy } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "GOOD MORNING";
  if (hour < 18) return "GOOD AFTERNOON";
  return "GOOD EVENING";
}

function formatDate(value: string) {
  return value ? new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "Date TBD";
}

function formatDateRange(startDate: string, endDate: string) {
  if (!startDate) return "Date TBD";
  if (!endDate) return formatDate(startDate);
  const start = new Date(startDate).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const end = new Date(endDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  return `${start} - ${end}`;
}

function statusLabel(status: string) {
  return status === "ONGOING" ? "LIVE" : status;
}

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) return notFound();

  const profile = await getAuthenticatedProfile(user);
  const [{ currentTournament, recentTournaments }, recentMatches] = await Promise.all([
    getDashboardTournaments(profile.id),
    listRecentMatchesForDashboard(profile.id),
  ]);
  const [currentTeamCount, currentMatchCount] = currentTournament
    ? await Promise.all([countTeams(profile.id, currentTournament.id), countMatches(profile.id, currentTournament.id)])
    : [0, 0];
  const panelClass = "rounded-[24px] border border-zinc-200 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.035)] sm:p-6";

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-5 rounded-[24px] border border-zinc-200 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.035)] sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">{getGreeting()}, {profile.name || "PLAYER"}</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">Welcome back</h1>
          <p className="mt-1 text-sm text-zinc-500">Manage your badminton matches and tournaments from one place.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href="/tournaments/new" className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600"><Plus size={16} /> New Tournament</Link>
          <Link href="/start-match" className="inline-flex items-center justify-center rounded-full border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50">Start Match</Link>
        </div>
      </header>

      <section className="rounded-[24px] border border-zinc-200 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.035)] sm:p-6">
        <div className="flex items-center justify-between gap-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">Current Tournament</p>{currentTournament ? <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">{statusLabel(currentTournament.status)}</span> : null}</div>
        {currentTournament ? (
          <div className="mt-4 grid gap-5 md:grid-cols-[180px_1fr_auto] md:items-center">
            <div className="h-28 overflow-hidden rounded-2xl bg-zinc-100">{currentTournament.bannerUrl ? <img src={currentTournament.bannerUrl} alt={`${currentTournament.name} banner`} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-emerald-600"><Trophy size={26} /></div>}</div>
            <div className="min-w-0"><h2 className="truncate text-xl font-semibold text-zinc-900">{currentTournament.name}</h2><div className="mt-2 grid gap-2 text-sm text-zinc-500 sm:grid-cols-2"><span className="flex items-center gap-2"><MapPin size={15} className="shrink-0 text-emerald-600" />{currentTournament.city || "Location TBD"}{currentTournament.ground ? `, ${currentTournament.ground}` : ""}</span><span className="flex items-center gap-2"><CalendarDays size={15} className="shrink-0 text-emerald-600" />{formatDateRange(currentTournament.startDate, currentTournament.endDate)}</span></div><div className="mt-4 flex gap-5 text-sm text-zinc-500"><span><strong className="text-zinc-900">{currentTeamCount}</strong> Teams</span><span><strong className="text-zinc-900">{currentMatchCount}</strong> Matches</span></div></div>
            <Link href={`/tournaments/${currentTournament.id}`} className="inline-flex items-center justify-center rounded-full border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50">Open Workspace <span aria-hidden className="ml-1">→</span></Link>
          </div>
        ) : (
          <div className="mt-4 flex flex-col items-start justify-between gap-4 rounded-2xl bg-zinc-50 px-4 py-4 sm:flex-row sm:items-center"><div><p className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-700">No active tournament</p><p className="mt-1 text-sm text-zinc-500">Create a tournament to get started.</p></div><Link href="/tournaments/new" className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"><Plus size={16} /> Create Tournament</Link></div>
        )}
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <div className={panelClass}>
          <div className="flex items-center justify-between gap-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">Recent Matches</p><Link href="/matches" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">View all matches <span aria-hidden>→</span></Link></div>
          <div className="mt-4 divide-y divide-zinc-100">{recentMatches.length ? recentMatches.map((match) => <div key={match.id} className="flex flex-col gap-2 py-3 first:pt-0 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="truncate text-sm font-semibold text-zinc-900">{match.homeName} <span className="font-normal text-zinc-400">vs</span> {match.awayName}</p><p className="mt-1 text-xs text-zinc-500">{formatDate(match.playedAt)} · {match.category?.replaceAll("_", " ") ?? "Match"}</p></div><div className="flex items-center gap-3 text-sm"><span className="font-semibold text-zinc-900">{match.scoreHome} - {match.scoreAway}</span><span className={`text-[11px] font-semibold uppercase tracking-wide ${match.status === "COMPLETED" ? "text-emerald-600" : "text-zinc-500"}`}>{match.status}</span></div></div>) : <div className="rounded-2xl bg-zinc-50 px-4 py-5"><p className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-700">No matches yet</p><p className="mt-1 text-sm text-zinc-500">Start your first match to see your match history here.</p></div>}</div>
        </div>

        <div className={panelClass}>
          <div className="flex items-center justify-between gap-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">Recent Tournaments</p><Link href="/tournaments" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">View all <span aria-hidden>→</span></Link></div>
          <div className="mt-4 divide-y divide-zinc-100">{recentTournaments.map((tournament) => <Link key={tournament.id} href={`/tournaments/${tournament.id}`} className="flex items-center gap-3 py-3 first:pt-0 transition hover:bg-zinc-50"><div className="h-9 w-12 shrink-0 overflow-hidden rounded-lg bg-zinc-100">{tournament.bannerUrl ? <img src={tournament.bannerUrl} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-emerald-600"><Trophy size={15} /></div>}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-zinc-900">{tournament.name}</p><p className="mt-1 text-xs text-zinc-500">{formatDate(tournament.startDate)}</p></div><span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{statusLabel(tournament.status)}</span><span aria-hidden className="text-zinc-400">→</span></Link>)}{!recentTournaments.length ? <div className="rounded-2xl bg-zinc-50 px-4 py-5"><p className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-700">No tournaments yet</p><p className="mt-1 text-sm text-zinc-500">Create a tournament to get started.</p></div> : null}</div>
        </div>
      </section>
    </div>
  );
}
