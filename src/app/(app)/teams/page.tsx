import { Plus } from "lucide-react";
import Link from "next/link";

export default function TeamsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[32px] border border-zinc-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)] sm:flex-row sm:items-end sm:justify-between sm:p-8">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-600">Team Builder</p>
          <h1 className="mt-2 text-3xl font-semibold text-zinc-900">Teams</h1>
          <p className="mt-2 text-sm text-zinc-500">Create temporary teams from your reusable player database.</p>
        </div>
        <Link href="/teams/new" className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600">
          <Plus size={18} />
          Create Team
        </Link>
      </div>
    </div>
  );
}
