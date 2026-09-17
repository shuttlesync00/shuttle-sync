import { TournamentForm } from "@/features/tournaments/tournament-form";

export default function NewTournamentPage() {
  return (
    <div className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)] sm:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Create Tournament</h1>
        <p className="mt-2 text-sm text-zinc-500">Create a tournament workspace that can host team, player, schedule, and match data.</p>
      </div>
      <TournamentForm />
    </div>
  );
}
