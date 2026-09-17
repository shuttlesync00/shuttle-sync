"use client";

import { FixtureCard } from "@/features/fixtures/fixture-card";
import { FixtureForm } from "@/features/fixtures/fixture-form";
import { useToast } from "@/hooks/use-toast";
import type { FixtureFormValues } from "@/lib/validations/fixture";
import type { FixtureRecord } from "@/types/fixture";
import type { PlayerRecord } from "@/types/player";
import type { TeamRecord } from "@/types/team";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const categories = ["ALL", "SINGLES", "DOUBLES", "MIXED_DOUBLES"] as const;
const statuses = ["ALL", "SCHEDULED", "LIVE", "COMPLETED"] as const;
const formatOptions = [
  { value: "ROUND_ROBIN", label: "Round Robin" },
] as const;

interface ExistingMatch {
  id: string;
  matchNumber: number | null;
  category: string | null;
  status: string;
}

export function FixtureWorkspace({ tournamentId }: { tournamentId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [fixtures, setFixtures] = useState<FixtureRecord[]>([]);
  const [teams, setTeams] = useState<TeamRecord[]>([]);
  const [players, setPlayers] = useState<PlayerRecord[]>([]);
  const [existingMatches, setExistingMatches] = useState<ExistingMatch[]>([]);
  const [selectedFixture, setSelectedFixture] = useState<FixtureRecord | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showFormatDialog, setShowFormatDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewFixtures, setPreviewFixtures] = useState<unknown[] | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<(typeof formatOptions)[number]["value"]>("ROUND_ROBIN");
  const [validationState, setValidationState] = useState<{ readyTeamCount: number; invalidTeams: Array<{ name: string; message: string }> } | null>(null);
  const [, setSaving] = useState(false);
  const [filterCategory, setFilterCategory] = useState<typeof categories[number]>("ALL");
  const [filterStatus, setFilterStatus] = useState<typeof statuses[number]>("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [fixturesResponse, teamsResponse, playersResponse, matchesResponse] = await Promise.all([
          fetch(`/api/fixtures?tournamentId=${encodeURIComponent(tournamentId)}`),
          fetch(`/api/teams?tournamentId=${encodeURIComponent(tournamentId)}`),
          fetch("/api/players"),
          fetch(`/api/matches?tournamentId=${encodeURIComponent(tournamentId)}`),
        ]);

        const fixturesPayload = await fixturesResponse.json();
        const teamsPayload = await teamsResponse.json();
        const playersPayload = await playersResponse.json();
        const matchesPayload = await matchesResponse.json();

        setFixtures(Array.isArray(fixturesPayload) ? fixturesPayload : []);
        setTeams(Array.isArray(teamsPayload) ? teamsPayload : []);
        setPlayers(Array.isArray(playersPayload) ? playersPayload : []);
        setExistingMatches(Array.isArray(matchesPayload) ? matchesPayload : []);
      } catch {
        toast({ title: "Unable to load fixtures.", type: "error" });
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [tournamentId, toast]);

  const teamMap = useMemo(() => {
    return new Map(teams.map((team) => [team.id, team]));
  }, [teams]);

  const canManageFixtures = fixtures.every((fixture) => fixture.status === "SCHEDULED");
  const canGenerateFixtures = canManageFixtures && teams.length >= 2;

  const filteredFixtures = useMemo(() => {
    return fixtures.filter((fixture) => {
      const teamA = fixture.teamAId ? teamMap.get(fixture.teamAId) : undefined;
      const teamB = fixture.teamBId ? teamMap.get(fixture.teamBId) : undefined;
      const searchTerm = search.trim().toLowerCase();

      if (filterCategory !== "ALL" && fixture.category !== filterCategory) {
        return false;
      }

      if (filterStatus !== "ALL" && fixture.status !== filterStatus) {
        return false;
      }

      if (!searchTerm) {
        return true;
      }

      return [
        fixture.matchNumber.toString(),
        fixture.category,
        fixture.status,
        fixture.court ?? "",
        teamA?.name ?? "",
        teamB?.name ?? "",
        fixture.notes ?? "",
      ].some((value) => value.toLowerCase().includes(searchTerm));
    });
  }, [fixtures, teamMap, filterCategory, filterStatus, search]);

  const groupedFixtures = useMemo(() => {
    const groups = new Map<number, FixtureRecord[]>();
    for (const fixture of filteredFixtures) {
      const round = fixture.round ?? 1;
      const current = groups.get(round) ?? [];
      current.push(fixture);
      groups.set(round, current);
    }

    return Array.from(groups.entries()).sort(([left], [right]) => left - right);
  }, [filteredFixtures]);

  function openCreateForm() {
    setSelectedFixture(null);
    setFormOpen(true);
  }

  function openEditForm(fixture: FixtureRecord) {
    setSelectedFixture(fixture);
    setFormOpen(true);
  }

  async function handleSave(values: FixtureFormValues) {
    setSaving(true);

    try {
      const payload = selectedFixture
        ? { id: selectedFixture.id, ...values }
        : { tournamentId, ...values };

      const response = await fetch("/api/fixtures", {
        method: selectedFixture ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.error ?? "Unable to save fixture.");
      }

      toast({ title: selectedFixture ? "Fixture updated." : "Fixture created.", type: "success" });
      setFormOpen(false);
      setSelectedFixture(null);
      await refreshFixtures();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save fixture.";
      toast({ title: message, type: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function refreshFixtures() {
    try {
      const response = await fetch(`/api/fixtures?tournamentId=${encodeURIComponent(tournamentId)}`);
      const payload = await response.json();
      setFixtures(Array.isArray(payload) ? payload : []);
    } catch {
      toast({ title: "Unable to refresh fixtures.", type: "error" });
    }
  }

  async function handleDelete(fixtureId: string) {
    if (!canManageFixtures) {
      toast({ title: "Fixtures cannot be deleted after a match has started.", type: "error" });
      return;
    }

    if (!window.confirm("Delete this fixture?")) {
      return;
    }

    try {
      const response = await fetch(`/api/fixtures?id=${encodeURIComponent(fixtureId)}`, {
        method: "DELETE",
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to delete fixture.");
      }

      toast({ title: "Fixture deleted.", type: "success" });
      await refreshFixtures();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to delete fixture.";
      toast({ title: message, type: "error" });
    }
  }

  async function handleDeleteAll() {
    if (!canManageFixtures) {
      toast({ title: "Fixtures cannot be deleted after a match has started.", type: "error" });
      return;
    }

    if (!window.confirm("Delete all generated fixtures?")) {
      return;
    }

    try {
      const response = await fetch(`/api/fixtures?tournamentId=${encodeURIComponent(tournamentId)}`, {
        method: "DELETE",
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to delete fixtures.");
      }
      toast({ title: "Fixtures deleted.", type: "success" });
      await refreshFixtures();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to delete fixtures.";
      toast({ title: message, type: "error" });
    }
  }

  async function handleValidationCheck() {
    try {
      const response = await fetch("/api/fixtures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "VALIDATE", tournamentId }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to validate rosters.");
      }

      setValidationState(payload);
      return payload;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to validate rosters.";
      toast({ title: message, type: "error" });
      return null;
    }
  }

  async function handleGenerateSchedule() {
    if (teams.length < 2) {
      toast({ title: "Add at least two teams first.", type: "error" });
      return;
    }

    setGenerating(true);

    try {
      const validation = await handleValidationCheck();
      if (!validation || validation.readyTeamCount < 2) {
        throw new Error("At least two READY teams are required.");
      }

      const response = await fetch("/api/fixtures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "PREVIEW", tournamentId, format: selectedFormat }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to preview schedule.");
      }

      setPreviewFixtures(Array.isArray(payload.generated) ? payload.generated : []);
      setShowPreview(true);
      setShowFormatDialog(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to preview schedule.";
      toast({ title: message, type: "error" });
    } finally {
      setGenerating(false);
    }
  }

  async function handleConfirmGenerate() {
    setGenerating(true);
    try {
      const response = await fetch("/api/fixtures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "GENERATE", tournamentId, format: selectedFormat }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to generate schedule.");
      }

      setFixtures(Array.isArray(payload) ? payload : []);
      setShowPreview(false);
      setPreviewFixtures(null);
      toast({ title: "Schedule generated.", type: "success" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to generate schedule.";
      toast({ title: message, type: "error" });
    } finally {
      setGenerating(false);
    }
  }

  async function handleStart(fixtureId: string) {
    try {
      const response = await fetch("/api/fixtures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "START", fixtureId }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to start match.");
      }

      await refreshFixtures();
      const matchesResponse = await fetch(`/api/matches?tournamentId=${encodeURIComponent(tournamentId)}`);
      const matchesPayload = await matchesResponse.json();
      setExistingMatches(Array.isArray(matchesPayload) ? matchesPayload : []);
      router.push(`/matches/${payload.match.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to start match.";
      toast({ title: message, type: "error" });
    }
  }

  const activeTeams = teams.filter((team) => team.id);
  const formInitialValues = selectedFixture
    ? {
        category: selectedFixture.category,
        teamAId: selectedFixture.teamAId ?? undefined,
        teamBId: selectedFixture.teamBId ?? undefined,
        playerAId: selectedFixture.playerAId ?? "",
        playerBId: selectedFixture.playerBId ?? "",
        court: selectedFixture.court ?? "",
        date: selectedFixture.date,
        time: selectedFixture.time,
        notes: selectedFixture.notes ?? "",
      }
    : undefined;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 rounded-[32px] border border-zinc-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)] sm:grid-cols-[1.2fr_auto] sm:items-center sm:p-8">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-600">Match Scheduling</p>
          <h1 className="mt-2 text-3xl font-semibold text-zinc-900">Fixtures</h1>
          <p className="mt-2 text-sm text-zinc-500">Create, update and schedule fixtures for this tournament.</p>
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          <button type="button" onClick={openCreateForm} className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600">
            Create Fixture
          </button>
          <button
            type="button"
            onClick={() => {
              void handleValidationCheck();
              setShowFormatDialog(true);
            }}
            disabled={!canGenerateFixtures || generating}
            className="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {!canGenerateFixtures ? "Fixtures locked" : generating ? "Generating…" : "Generate Fixtures"}
          </button>
          <button type="button" onClick={handleDeleteAll} disabled={!canManageFixtures} className="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50">
            Delete Fixtures
          </button>
        </div>
      </div>

      {showFormatDialog ? (
        <div className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-600">Tournament Format</p>
              <h2 className="mt-2 text-xl font-semibold text-zinc-900">Choose how fixtures should be generated</h2>
            </div>
            <button type="button" onClick={() => setShowFormatDialog(false)} className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50">Close</button>
          </div>

          <div className="mt-6 space-y-3">
            {formatOptions.map((option) => (
              <label key={option.value} className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-700">
                <input type="radio" name="format" value={option.value} checked={selectedFormat === option.value} onChange={() => setSelectedFormat(option.value)} />
                <span>{option.label}</span>
              </label>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
            {validationState && validationState.readyTeamCount < 2 ? (
              <div>
                <p className="font-semibold">At least two READY teams are required.</p>
                {validationState.invalidTeams.map((team) => (
                  <p key={`${team.name}-${team.message}`} className="mt-2">• {team.name}: {team.message}</p>
                ))}
              </div>
            ) : (
              <p>Generate a round-robin schedule for the current tournament.</p>
            )}
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button type="button" onClick={() => void handleGenerateSchedule()} disabled={generating || !canGenerateFixtures || (validationState?.readyTeamCount ?? 0) < 2} className="rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50">
              {generating ? "Generating…" : "Generate Fixtures"}
            </button>
          </div>
        </div>
      ) : null}

      {showPreview && previewFixtures ? (
        <div className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-zinc-900">Preview Schedule</h2>
              <p className="mt-1 text-sm text-zinc-500">Review the generated fixtures before confirming.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowPreview(false); setPreviewFixtures(null); }} className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50">Cancel</button>
              <button onClick={() => void handleConfirmGenerate()} disabled={generating} className="rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50">{generating ? "Generating…" : "Confirm Schedule"}</button>
            </div>
          </div>

          <div className="space-y-4">
            {(() => {
              const groups = new Map<number, unknown[]>();
              for (const f of previewFixtures) {
                const r = (f as { round?: number }).round ?? 1;
                const current = groups.get(r) ?? [];
                current.push(f);
                groups.set(r, current);
              }

              return Array.from(groups.entries()).sort(([a], [b]) => a - b).map(([round, fixtures]) => (
                <div key={round} className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
                  <h3 className="font-semibold">Round {round}</h3>
                  <ul className="mt-2 space-y-1 text-sm text-zinc-700">
                    {fixtures.map((fx, idx: number) => (
                      <li key={idx}>Match {idx + 1}: {(teamMap.get((fx as { teamAId: string }).teamAId)?.name) ?? (fx as { teamAId: string }).teamAId} vs {(teamMap.get((fx as { teamBId: string }).teamBId)?.name) ?? (fx as { teamBId: string }).teamBId}</li>
                    ))}
                  </ul>
                </div>
              ));
            })()}
          </div>
        </div>
      ) : null}

      <div className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block text-sm">
            <span className="mb-2 block font-medium text-zinc-700">Category</span>
            <select className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4" value={filterCategory} onChange={(event) => setFilterCategory(event.target.value as typeof categories[number])}>
              {categories.map((category) => (
                <option key={category} value={category}>{category === "ALL" ? "All categories" : category.replace("_", " ")}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-2 block font-medium text-zinc-700">Status</span>
            <select className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4" value={filterStatus} onChange={(event) => setFilterStatus(event.target.value as typeof statuses[number])}>
              {statuses.map((status) => (
                <option key={status} value={status}>{status === "ALL" ? "All statuses" : status.replace("_", " ")}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-2 block font-medium text-zinc-700">Search</span>
            <input
              className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search fixtures"
            />
          </label>
        </div>
      </div>

      <div className="rounded-3xl bg-zinc-50 p-5 text-sm text-zinc-600">
        {teams.length === 0 ? (
          "No teams available. Create teams first so you can schedule fixtures."
        ) : (
          <p>{teams.length} team{teams.length === 1 ? "" : "s"} available for scheduling.</p>
        )}
      </div>

      {formOpen ? (
        <div className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-zinc-900">{selectedFixture ? "Edit Fixture" : "New Fixture"}</h2>
              <p className="mt-1 text-sm text-zinc-500">Use this form to schedule or update a match.</p>
            </div>
            <button type="button" onClick={() => { setFormOpen(false); setSelectedFixture(null); }} className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50">
              Close
            </button>
          </div>
          <div className="mt-6">
            <FixtureForm
              teams={activeTeams}
              players={players}
              initialValues={formInitialValues}
              mode={selectedFixture ? "edit" : "create"}
              onSave={handleSave}
              onCancel={() => { setFormOpen(false); setSelectedFixture(null); }}
            />
          </div>
        </div>
      ) : null}

      <div className="space-y-6">
        {loading ? (
          <div className="rounded-[32px] border border-zinc-200 bg-white p-10 text-center text-zinc-500">Loading fixtures…</div>
        ) : filteredFixtures.length === 0 ? (
          <div className="rounded-[32px] border border-zinc-200 bg-white p-10 text-center text-zinc-500">No fixtures match the current filters.</div>
        ) : (
          groupedFixtures.map(([round, roundFixtures]) => (
            <div key={round} className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-zinc-900">Round {round}</h2>
                <p className="text-sm text-zinc-500">{roundFixtures.length} fixture{roundFixtures.length === 1 ? "" : "s"}</p>
              </div>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {roundFixtures.map((fixture) => (
                  (() => {
                    const existingMatch = existingMatches.find((match) => match.matchNumber === fixture.matchNumber && match.category === fixture.category && match.status !== "COMPLETED");
                    return (
                  <FixtureCard
                    key={fixture.id}
                    fixture={fixture}
                    teamA={fixture.teamAId ? teamMap.get(fixture.teamAId) : undefined}
                    teamB={fixture.teamBId ? teamMap.get(fixture.teamBId) : undefined}
                    onStart={() => void handleStart(fixture.id)}
                    onContinue={existingMatch ? () => router.push(`/matches/${existingMatch.id}`) : undefined}
                    onEdit={() => openEditForm(fixture)}
                    onDelete={() => void handleDelete(fixture.id)}
                  />
                    );
                  })()
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
