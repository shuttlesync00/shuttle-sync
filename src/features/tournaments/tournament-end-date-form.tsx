"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function TournamentEndDateForm({ tournamentId, endDate }: { tournamentId: string; endDate: string }) {
  const router = useRouter();
  const [value, setValue] = useState(endDate ? endDate.slice(0, 10) : "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await fetch("/api/tournaments", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "UPDATE_END_DATE", id: tournamentId, endDate: value }) });
    router.refresh();
    setSaving(false);
  }

  return (
    <div className="mt-4 border-t border-zinc-200 pt-4">
      <p className="text-sm font-medium text-zinc-900">Tournament end date</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <input type="date" value={value} onChange={(event) => setValue(event.target.value)} className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm" />
        <button type="button" onClick={() => void save()} disabled={!value || saving} className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving…" : "Save date"}</button>
      </div>
    </div>
  );
}