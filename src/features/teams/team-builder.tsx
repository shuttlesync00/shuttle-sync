"use client";

import { AuthButton } from "@/components/auth/auth-button";
import { AuthInput } from "@/components/auth/auth-input";
import { SelectedPlayersList } from "@/features/teams/selected-players-list";
import { useToast } from "@/hooks/use-toast";
import { teamSchema, type TeamFormValues } from "@/lib/validations/team";
import type { PlayerRecord } from "@/types/player";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

function getPlayerNames(values: TeamFormValues & { player1Name?: string; player2Name?: string }) {
  return values.category === "SINGLES" ? [values.player1Name ?? ""] : [values.player1Name ?? "", values.player2Name ?? ""];
}

interface TeamBuilderProps {
  players: PlayerRecord[];
  tournamentId?: string;
}

export function TeamBuilder({ players, tournamentId }: TeamBuilderProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { register, handleSubmit, setValue, control, getValues, formState: { errors, isSubmitting } } = useForm<TeamFormValues & { player1Name?: string; player2Name?: string }>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: "",
      logoUrl: "",
      category: "DOUBLES",
      playerIds: [],
      player1Name: "",
      player2Name: "",
    },
  });

  const player1Name = useWatch({ control, name: "player1Name", defaultValue: "" }) as string;
  const player2Name = useWatch({ control, name: "player2Name", defaultValue: "" }) as string;
  const category = useWatch({ control, name: "category", defaultValue: "DOUBLES" }) as TeamFormValues["category"];
  const teamName = useWatch({ control, name: "name", defaultValue: "" });

  const selectedPlayers = useMemo(() => {
    const names = category === "SINGLES" ? [player1Name] : [player1Name, player2Name];
    const trimmed = names.map((n) => (n || "").trim().toLowerCase()).filter(Boolean);
    if (trimmed.length === 0) return [];
    return players.filter((p) => trimmed.includes(p.fullName.trim().toLowerCase()));
  }, [players, category, player1Name, player2Name]);

  function removePlayer(playerId: string) {
    const next = selectedIds.filter((id) => id !== playerId);
    setSelectedIds(next);
    setValue("playerIds", next, { shouldValidate: true });
  }

  async function onSubmit(values: TeamFormValues) {
    const requiredCount = values.category === "SINGLES" ? 1 : 2;

    // Map entered player names to existing player IDs.
    const formValues = getValues();
    const enteredNames = getPlayerNames(formValues);
    const trimmedNames = enteredNames.map((n) => (n || "").trim()).filter(Boolean);
    if (trimmedNames.length !== requiredCount) {
      toast({ title: `Please enter ${requiredCount} player name${requiredCount > 1 ? "s" : ""}.`, type: "error" });
      return;
    }

    const foundIds: string[] = [];
    for (const name of trimmedNames) {
      const match = players.find((p) => p.fullName.trim().toLowerCase() === name.toLowerCase());
      if (!match) {
        toast({ title: `Player "${name}" not found. Add the player via Players → Add Player first.`, type: "error" });
        return;
      }
      foundIds.push(match.id);
    }

    values.playerIds = foundIds;
    const playerIds = values.playerIds ?? [];

    if (values.category === "MIXED_DOUBLES") {
      const genders = players.filter((p) => playerIds.includes(p.id)).map((player) => player.gender);
      if (!genders.includes("MALE") || !genders.includes("FEMALE")) {
        toast({ title: "Mixed doubles must include one male and one female player.", type: "error" });
        return;
      }
    }

    const response = await fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, tournamentId }),
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      toast({ title: payload?.error ?? "Unable to save team", type: "error" });
      return;
    }

    toast({ title: "Team created", type: "success" });
    if (tournamentId) {
      router.push(`/tournaments/${tournamentId}/teams`);
    } else {
      router.push(`/teams/${payload.id}`);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <form className="space-y-5 rounded-[28px] border border-zinc-200 bg-white p-6 shadow-[0_14px_35px_rgba(15,23,42,0.05)]" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4 md:grid-cols-2">
          <AuthInput label="Team Name" error={errors.name?.message} {...register("name")} />
          <AuthInput label="Team Logo URL (optional)" error={errors.logoUrl?.message} {...register("logoUrl")} />
        </div>

        <label className="block text-sm">
          <span className="mb-2 block font-medium text-zinc-700">Playing Category</span>
          <select className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4" {...register("category")}>
            <option value="SINGLES">Singles</option>
            <option value="DOUBLES">Doubles</option>
            <option value="MIXED_DOUBLES">Mixed Doubles</option>
          </select>
        </label>

        <div>
          <p className="mb-2 text-sm font-medium text-zinc-700">Add Players</p>
          <div className="grid gap-4 md:grid-cols-2">
            <AuthInput label={category === "SINGLES" ? "Player Name" : "Player 1 Name"} error={undefined} {...register("player1Name")} />
            {category !== "SINGLES" ? <AuthInput label="Player 2 Name" error={undefined} {...register("player2Name")} /> : null}
          </div>
          {errors.playerIds ? <p className="mt-2 text-sm text-red-500">{errors.playerIds.message}</p> : null}
        </div>

        <AuthButton type="submit" isLoading={isSubmitting}>Create Team</AuthButton>
      </form>

      <div className="space-y-4 rounded-[28px] border border-zinc-200 bg-zinc-50 p-6 shadow-[0_14px_35px_rgba(15,23,42,0.05)]">
        <h3 className="text-lg font-semibold text-zinc-900">Team Preview</h3>
        <div className="rounded-[24px] border border-zinc-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500">Preview</p>
              <p className="text-xl font-semibold text-zinc-900">{teamName || "Your Team"}</p>
            </div>
            <div className="rounded-full bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-600">{category}</div>
          </div>
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium text-zinc-700">Selected Players</p>
            <SelectedPlayersList players={selectedPlayers} onRemove={removePlayer} />
          </div>
        </div>
      </div>
    </div>
  );
}
