import { PlayerForm } from "@/features/players/player-form";

export default function NewPlayerPage() {
  return (
    <div className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)] sm:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Add Player</h1>
        <p className="mt-2 text-sm text-zinc-500">Create a permanent player entry that can be reused across tournaments and friendly matches.</p>
      </div>
      <PlayerForm />
    </div>
  );
}
