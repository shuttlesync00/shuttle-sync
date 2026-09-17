"use client";

import { AuthButton } from "@/components/auth/auth-button";
import { AuthInput } from "@/components/auth/auth-input";
import { useToast } from "@/hooks/use-toast";
import { validateTeamRoster } from "@/lib/roster";
import { playerSchema, type PlayerFormValues } from "@/lib/validations/player";
import type { PlayerRecord } from "@/types/player";
import type { TeamRecord } from "@/types/team";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

interface TeamDetailsProps {
  team: TeamRecord;
  initialPlayers: PlayerRecord[];
}

export function TeamDetails({ team, initialPlayers }: TeamDetailsProps) {
  const { toast } = useToast();
  const [players, setPlayers] = useState<PlayerRecord[]>(initialPlayers);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PlayerFormValues>({
    resolver: zodResolver(playerSchema),
    defaultValues: {
      photoUrl: "",
      fullName: "",
      gender: "MALE",
      dateOfBirth: "",
      phoneNumber: "",
      email: "",
      preferredHand: "RIGHT",
      playingLevel: "INTERMEDIATE",
      city: "",
      state: "",
      country: "",
    },
  });

  const rosterStatus = useMemo(() => validateTeamRoster(team, players), [players, team]);

  async function onSubmit(values: PlayerFormValues) {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/teams/${team.id}/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to save player.");
      }

      setPlayers((current) => [payload, ...current]);
      setFormOpen(false);
      reset();
      toast({ title: "Player added to team.", type: "success" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save player.";
      toast({ title: message, type: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove(playerId: string) {
    try {
      const response = await fetch(`/api/players/${playerId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Unable to remove player.");
      }
      setPlayers((current) => current.filter((player) => player.id !== playerId));
      toast({ title: "Player removed from team.", type: "success" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to remove player.";
      toast({ title: message, type: "error" });
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)] sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-600">Team Details</p>
            <h1 className="mt-2 text-3xl font-semibold text-zinc-900">{team.name}</h1>
            <p className="mt-2 text-sm text-zinc-500">Category: {team.category}</p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
            <p className="font-semibold text-zinc-900">Roster status</p>
            <p className={rosterStatus.status === "READY" ? "text-emerald-600" : rosterStatus.status === "INVALID" ? "text-rose-600" : "text-amber-600"}>{rosterStatus.status}</p>
            <p className="mt-1 text-sm text-zinc-500">{rosterStatus.message}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-zinc-900">Players</h2>
              <p className="mt-1 text-sm text-zinc-500">Manage the roster for this team.</p>
            </div>
            <button type="button" onClick={() => setFormOpen((current) => !current)} className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600">
              <Plus size={16} />
              Add Player
            </button>
          </div>

          {formOpen ? (
            <form className="mt-6 space-y-5 rounded-[28px] border border-zinc-200 bg-zinc-50 p-5" onSubmit={handleSubmit(onSubmit)}>
              <div className="grid gap-4 md:grid-cols-2">
                <AuthInput label="Full Name" error={errors.fullName?.message} {...register("fullName")} />
                <label className="block text-sm">
                  <span className="mb-2 block font-medium text-zinc-700">Gender</span>
                  <select className="h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4" {...register("gender")}>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <AuthInput label="Date of Birth" type="date" error={errors.dateOfBirth?.message} {...register("dateOfBirth")} />
                <AuthInput label="Phone Number" error={errors.phoneNumber?.message} {...register("phoneNumber")} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <AuthInput label="Email" type="email" error={errors.email?.message} {...register("email")} />
                <label className="block text-sm">
                  <span className="mb-2 block font-medium text-zinc-700">Preferred Hand</span>
                  <select className="h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4" {...register("preferredHand")}>
                    <option value="RIGHT">Right</option>
                    <option value="LEFT">Left</option>
                  </select>
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-2 block font-medium text-zinc-700">Playing Level</span>
                  <select className="h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4" {...register("playingLevel")}>
                    <option value="BEGINNER">Beginner</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="ADVANCED">Advanced</option>
                    <option value="PROFESSIONAL">Professional</option>
                  </select>
                </label>
                <AuthInput label="Photo URL (optional)" error={errors.photoUrl?.message} {...register("photoUrl")} />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <AuthInput label="City" error={errors.city?.message} {...register("city")} />
                <AuthInput label="State" error={errors.state?.message} {...register("state")} />
                <AuthInput label="Country" error={errors.country?.message} {...register("country")} />
              </div>

              <div className="flex flex-wrap gap-3">
                <AuthButton type="submit" isLoading={submitting || isSubmitting}>Save Player</AuthButton>
                <button type="button" onClick={() => setFormOpen(false)} className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50">
                  Cancel
                </button>
              </div>
            </form>
          ) : null}

          <div className="mt-6 space-y-3">
            {players.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-zinc-200 bg-zinc-50 p-6 text-center text-sm text-zinc-500">
                No players are linked to this team yet.
              </div>
            ) : (
              players.map((player) => (
                <div key={player.id} className="flex items-center justify-between rounded-[24px] border border-zinc-200 bg-zinc-50 px-4 py-3">
                  <div>
                    <p className="font-semibold text-zinc-900">{player.fullName}</p>
                    <p className="text-sm text-zinc-500">{player.gender} • {player.preferredHand} • {player.playingLevel}</p>
                  </div>
                  <button type="button" onClick={() => handleRemove(player.id)} className="rounded-full p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-rose-600">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
          <h2 className="text-xl font-semibold text-zinc-900">Team Summary</h2>
          <div className="mt-4 space-y-3 text-sm text-zinc-600">
            <div className="rounded-[24px] border border-zinc-200 bg-zinc-50 p-4">
              <p className="font-semibold text-zinc-900">Team</p>
              <p>{team.name}</p>
            </div>
            <div className="rounded-[24px] border border-zinc-200 bg-zinc-50 p-4">
              <p className="font-semibold text-zinc-900">Tournament</p>
              <p>{team.tournamentId ?? "Unassigned"}</p>
            </div>
            <div className="rounded-[24px] border border-zinc-200 bg-zinc-50 p-4">
              <p className="font-semibold text-zinc-900">Roster size</p>
              <p>{rosterStatus.currentPlayers} / {rosterStatus.requiredPlayers}</p>
            </div>
            <div className="rounded-[24px] border border-zinc-200 bg-zinc-50 p-4">
              <p className="font-semibold text-zinc-900">Status</p>
              <p>{rosterStatus.status}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
