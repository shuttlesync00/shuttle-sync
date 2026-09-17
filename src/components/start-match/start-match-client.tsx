"use client";

import { PlayerCombobox } from "@/components/players/player-combobox";
import { ShuttleSelect } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { FixtureRecord } from "@/types/fixture";
import type { PlayerRecord } from "@/types/player";
import type { TeamRecord } from "@/types/team";
import type { TournamentRecord } from "@/types/tournament";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

interface StartMatchClientProps {
  tournaments: TournamentRecord[];
}

interface FixtureDetails {
  id: string;
  tournamentId: string;
  category: string;
  teamAId: string;
  teamBId: string;
  matchNumber: number;
  time?: string | null;
  court?: string | null;
  status: string;
}

export function StartMatchClient({ tournaments }: StartMatchClientProps) {
  const searchParams = useSearchParams();
  const fixtureId = searchParams?.get("fixtureId") ?? undefined;
  const tournamentId = searchParams?.get("tournamentId") ?? undefined;
  const { toast } = useToast();
  const router = useRouter();

  const [selectedTournamentId, setSelectedTournamentId] = useState<string | undefined>(tournamentId);
  const [loading, setLoading] = useState(false);
  const [fixture, setFixture] = useState<FixtureDetails | null>(null);
  const [error, setError] = useState<string | null>(fixtureId ? null : tournaments.length === 0 ? "No tournaments available." : null);
  const [fixtures, setFixtures] = useState<FixtureRecord[]>([]);
  const [teams, setTeams] = useState<TeamRecord[]>([]);
  const [players, setPlayers] = useState<PlayerRecord[]>([]);
  const [formState, setFormState] = useState({
    teamAId: "",
    teamBId: "",
    court: "",
    time: "",
    notes: "",
    bestOf: 3,
    gamePointTarget: 21,
    category: "DOUBLES",
    playerAId: "",
    playerBId: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [creatingMatch, setCreatingMatch] = useState(false);

  const selectedTournament = useMemo(
    () => tournaments.find((tournament) => tournament.id === selectedTournamentId),
    [selectedTournamentId, tournaments],
  );

  const scheduledFixtures = useMemo(
    () => selectedTournamentId ? fixtures.filter((fixture) => fixture.status === "SCHEDULED") : [],
    [fixtures, selectedTournamentId],
  );

  const manualTeamA = useMemo(
    () => teams.find((team) => team.id === formState.teamAId),
    [teams, formState.teamAId],
  );
  const manualTeamB = useMemo(
    () => teams.find((team) => team.id === formState.teamBId),
    [teams, formState.teamBId],
  );

  const manualCategory = useMemo(() => {
    if (!manualTeamA || !manualTeamB) return undefined;
    return manualTeamA.category === manualTeamB.category ? manualTeamA.category : undefined;
  }, [manualTeamA, manualTeamB]);

  const manualSelectionInvalid = useMemo(() => {
    if (formState.category === "SINGLES") {
      if (!formState.playerAId || !formState.playerBId) return "Select both players.";
      if (formState.playerAId === formState.playerBId) return "Player A and Player B must be different.";
    } else {
      if (!formState.teamAId || !formState.teamBId) return "Select both teams.";
      if (formState.teamAId === formState.teamBId) return "Team A and Team B must be different.";
      if (!manualCategory) return "Selected teams must belong to the same category.";
    }
    if (selectedTournament?.status === "COMPLETED") return "Cannot start matches for a completed tournament.";
    return null;
  }, [selectedTournament, formState.category, formState.playerAId, formState.playerBId, formState.teamAId, formState.teamBId, manualCategory]);

  useEffect(() => {
    if (!selectedTournamentId) {
      void Promise.all([fetch("/api/teams").then((response) => response.json()), fetch("/api/players").then((response) => response.json())]).then(([teamPayload, playerPayload]) => { setTeams(Array.isArray(teamPayload) ? teamPayload : []); setPlayers(Array.isArray(playerPayload) ? playerPayload : []); });
      return;
    }

    let isMounted = true;
    const safeSetState = (fn: () => void) => {
      if (isMounted) fn();
    };

    async function loadData() {
      safeSetState(() => {
        setLoading(true);
        setError(null);
      });

      try {
        const [fixturesResponse, teamsResponse, playersResponse] = await Promise.all([
          fetch(`/api/fixtures?tournamentId=${encodeURIComponent(selectedTournamentId ?? "")}`),
          fetch(`/api/teams?tournamentId=${encodeURIComponent(selectedTournamentId ?? "")}`),
          fetch("/api/players"),
        ]);

        const fixturesPayload = await fixturesResponse.json();
        const teamsPayload = await teamsResponse.json();
        const playersPayload = await playersResponse.json();

        safeSetState(() => {
          setFixtures(Array.isArray(fixturesPayload) ? fixturesPayload : []);
          setTeams(Array.isArray(teamsPayload) ? teamsPayload : []);
          setPlayers(Array.isArray(playersPayload) ? playersPayload : []);
          if (!tournaments.length) {
            setError("No tournaments available.");
          }
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unable to load tournament data.";
        safeSetState(() => {
          setError(message);
        });
        toast({ title: message, type: "error" });
      } finally {
        safeSetState(() => {
          setLoading(false);
        });
      }
    }

    void loadData();
    return () => {
      isMounted = false;
    };
  }, [selectedTournamentId, tournaments.length, toast]);

  useEffect(() => {
    if (!fixtureId) {
      return;
    }

    let isMounted = true;
    const safeSetState = (fn: () => void) => {
      if (isMounted) fn();
    };

    async function loadFixture() {
      safeSetState(() => {
        setLoading(true);
        setError(null);
      });

      try {
        const response = await fetch(`/api/fixtures?fixtureId=${encodeURIComponent(fixtureId ?? "")}`);
        const payload = await response.json();

        if (!response.ok || !payload) {
          throw new Error(payload?.error ?? "Unable to load fixture.");
        }

        safeSetState(() => {
          setFixture(payload);
          setError(null);
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unable to load fixture.";
        safeSetState(() => {
          setError(message);
        });
        toast({ title: message, type: "error" });
      } finally {
        safeSetState(() => {
          setLoading(false);
        });
      }
    }

    void loadFixture();

    return () => {
      isMounted = false;
    };
  }, [fixtureId, toast]);

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

      router.push(`/matches/${payload.match.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to start match.";
      toast({ title: message, type: "error" });
    }
  }

  async function handleCreateManualMatch() {
    setFormError(null);

    if (manualSelectionInvalid) { setFormError(manualSelectionInvalid); return; }

    setCreatingMatch(true);

    try {
      const response = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tournamentId: selectedTournamentId,
          bestOf: formState.bestOf,
          gamePointTarget: formState.gamePointTarget,
          category: formState.category,
          playerAId: formState.playerAId || undefined,
          playerBId: formState.playerBId || undefined,
          teamAId: formState.teamAId,
          teamBId: formState.teamBId,
          court: formState.court || undefined,
          time: formState.time || undefined,
          notes: formState.notes || undefined,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to start match.");
      }

      router.push(`/matches/${payload.match.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to start match.";
      setFormError(message);
      toast({ title: message, type: "error" });
    } finally {
      setCreatingMatch(false);
    }
  }

  return (
    <div className="rounded-[32px] border border-zinc-200 bg-white p-8 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
      <h1 className="text-2xl font-semibold text-zinc-900">Start Match</h1>
      <p className="mt-3 text-sm text-zinc-500">Open scoring for a scheduled fixture or start a one-off match.</p>

      {fixtureId ? (
        loading ? (
          <div className="mt-8 text-sm text-zinc-500">Loading fixture…</div>
        ) : error ? (
          <div className="mt-8 rounded-[24px] bg-rose-50 p-5 text-sm text-rose-700">{error}</div>
        ) : fixture ? (
          <div className="mt-8 space-y-4">
            <div className="rounded-[28px] bg-zinc-50 p-5">
              <p className="text-sm text-zinc-500">Fixture selected</p>
              <p className="mt-2 text-xl font-semibold text-zinc-900">Match {fixture.matchNumber}</p>
              <p className="mt-1 text-sm text-zinc-600">{fixture.teamAId} vs {fixture.teamBId}</p>
            </div>
            <div className="rounded-[28px] border border-zinc-200 bg-white p-5 text-sm text-zinc-500">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p>Scoring interface is still being built. The selected fixture is ready to launch.</p>
                <button onClick={() => void handleStart(fixture.id)} className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white">Start Match</button>
              </div>
            </div>
          </div>
        ) : null
      ) : (
        <div className="mt-8 space-y-8">
          <div className="mx-auto w-full max-w-3xl">
            <div className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)] sm:p-8">
              <div className="text-center">
                <h2 className="mt-2 text-2xl font-semibold text-zinc-900">Let&apos;s Play</h2>
                <p className="mt-2 text-sm text-zinc-500">Choose a tournament or start a one-off match.</p>
              </div>

              <div className="mt-6">
                <ShuttleSelect
                  label="Tournament"
                  value={selectedTournamentId ?? ""}
                  placeholder="One-off match (no tournament)"
                  options={[
                    { label: "One-off match (no tournament)", value: "" },
                    ...tournaments.map((tournament) => ({
                      label: `${tournament.name}${tournament.status === "COMPLETED" ? " (Completed)" : ""}`,
                      value: tournament.id,
                    })),
                  ]}
                  onValueChange={(value) => setSelectedTournamentId(value || undefined)}
                />
              </div>

              {selectedTournament ? (
                <div className="mt-3 rounded-2xl bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
                  <span className="font-medium text-zinc-900">Tournament status:</span> {selectedTournament.status}
                </div>
              ) : null}

              <div className="mt-6">
                <ShuttleSelect
                  label="Category"
                  value={formState.category}
                  options={[
                    { label: "Singles", value: "SINGLES" },
                    { label: "Doubles", value: "DOUBLES" },
                    { label: "Mixed Doubles", value: "MIXED_DOUBLES" },
                  ]}
                  onValueChange={(value) => setFormState({ ...formState, category: value, teamAId: "", teamBId: "", playerAId: "", playerBId: "" })}
                />
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {formState.category === "SINGLES" ? <>
                <PlayerCombobox label="Player A" players={players} value={formState.playerAId} onChange={(playerId) => setFormState({ ...formState, playerAId: playerId })} />
                <PlayerCombobox label="Player B" players={players} value={formState.playerBId} onChange={(playerId) => setFormState({ ...formState, playerBId: playerId })} />
                </> : <>
                <ShuttleSelect
                  label="Team A"
                  value={formState.teamAId}
                  placeholder="Select Team A"
                  options={teams.map((team) => ({
                    label: team.name,
                    value: team.id,
                    disabled: team.id === formState.teamBId,
                  }))}
                  onValueChange={(value) => setFormState({ ...formState, teamAId: value })}
                />

                <ShuttleSelect
                  label="Team B"
                  value={formState.teamBId}
                  placeholder="Select Team B"
                  options={teams.map((team) => ({
                    label: team.name,
                    value: team.id,
                    disabled: team.id === formState.teamAId,
                  }))}
                  onValueChange={(value) => setFormState({ ...formState, teamBId: value })}
                />
                </>}
              </div>

              {formState.category === "SINGLES" && players.length === 0 ? (
                <p className="mt-4 text-sm text-zinc-500">Register players on the <Link className="font-semibold text-emerald-600 hover:underline" href="/players">Players page</Link> before starting a Singles match.</p>
              ) : null}

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-2 block font-medium text-zinc-700">Court (optional)</span>
                  <input className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4" value={formState.court} onChange={(event) => setFormState({ ...formState, court: event.target.value })} />
                </label>
                <div className="block text-sm">
                  <ShuttleSelect
                    label="Game length"
                    value={String(formState.gamePointTarget)}
                    options={[
                      { label: "11 points", value: "11" },
                      { label: "21 points", value: "21" },
                    ]}
                    onValueChange={(value) => setFormState({ ...formState, gamePointTarget: Number(value) || 21 })}
                  />
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-2 block font-medium text-zinc-700">Start time</span>
                  <input type="time" className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4" value={formState.time} onChange={(event) => setFormState({ ...formState, time: event.target.value })} />
                </label>
                <div className="block text-sm">
                  <ShuttleSelect
                    label="Sets per match"
                    value={String(formState.bestOf)}
                    options={[1, 3, 5].map((sets) => ({
                      label: `${sets} set${sets === 1 ? "" : "s"}`,
                      value: String(sets),
                    }))}
                    onValueChange={(value) => setFormState({ ...formState, bestOf: Number(value) })}
                  />
                </div>
              </div>

              <label className="mt-4 block text-sm">
                <span className="mb-2 block font-medium text-zinc-700">Notes</span>
                <input className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4" value={formState.notes} onChange={(event) => setFormState({ ...formState, notes: event.target.value })} />
              </label>

              {manualCategory ? (
                <div className="mt-4 rounded-3xl bg-emerald-50 p-4 text-sm text-emerald-700">Category: {manualCategory.replace("_", " ")}</div>
              ) : null}

              {manualSelectionInvalid ? (
                <div className="mt-4 rounded-3xl bg-rose-50 p-4 text-sm text-rose-700">{manualSelectionInvalid}</div>
              ) : null}

              {formError ? (
                <div className="mt-4 rounded-3xl bg-rose-50 p-4 text-sm text-rose-700">{formError}</div>
              ) : null}

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={handleCreateManualMatch}
                  disabled={creatingMatch || Boolean(manualSelectionInvalid)}
                  className="rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creatingMatch ? "Starting…" : "Start Match"}
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-zinc-200 bg-white p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-700">Scheduled fixtures</p>
                <p className="mt-2 text-sm text-zinc-500">Start scoring for a scheduled tournament match.</p>
              </div>
              <div className="rounded-full bg-zinc-50 px-4 py-2 text-sm text-zinc-700">{scheduledFixtures.length} scheduled fixture{scheduledFixtures.length === 1 ? "" : "s"}</div>
            </div>

            {loading ? (
              <div className="mt-6 rounded-[24px] border border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-500">Loading fixtures…</div>
            ) : selectedTournament && selectedTournament.status === "COMPLETED" ? (
              <div className="mt-6 rounded-[24px] bg-rose-50 p-6 text-sm text-rose-700">This tournament is completed and cannot start new matches.</div>
            ) : scheduledFixtures.length === 0 ? (
              <div className="mt-6 rounded-[24px] bg-zinc-50 p-6 text-sm text-zinc-600">No scheduled fixtures are available for this tournament.</div>
            ) : (
              <div className="mt-6 space-y-3">
                {scheduledFixtures.map((fixture) => (
                  <div key={fixture.id} className="flex flex-col gap-3 rounded-[28px] border border-zinc-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-zinc-900">Match {fixture.matchNumber}</p>
                      <p className="text-sm text-zinc-600">{fixture.teamAId} vs {fixture.teamBId}</p>
                      <p className="mt-1 text-sm text-zinc-500">{fixture.date} • {fixture.time || "TBD"} • {fixture.court ?? "TBD"}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleStart(fixture.id)}
                      className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
                    >
                      Start Match
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
