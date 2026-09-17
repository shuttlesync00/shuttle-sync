"use client";

import { AuthButton } from "@/components/auth/auth-button";
import { AuthInput } from "@/components/auth/auth-input";
import { PlayerCombobox } from "@/components/players/player-combobox";
import { fixtureSchema, type FixtureFormValues } from "@/lib/validations/fixture";
import type { PlayerRecord } from "@/types/player";
import type { TeamRecord } from "@/types/team";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";

interface FixtureFormProps {
  teams: TeamRecord[];
  players: PlayerRecord[];
  initialValues?: Partial<FixtureFormValues>;
  mode?: "create" | "edit";
  onSave: (values: FixtureFormValues) => Promise<void>;
  onCancel: () => void;
}

export function FixtureForm({ teams, players, initialValues, mode = "create", onSave, onCancel }: FixtureFormProps) {
  const { register, handleSubmit, setValue, control, formState: { errors, isSubmitting } } = useForm<FixtureFormValues>({
    resolver: zodResolver(fixtureSchema),
    defaultValues: {
      category: "SINGLES",
      bestOf: 3,
      teamAId: "",
      teamBId: "",
      playerAId: "",
      playerBId: "",
      court: "",
      date: "",
      time: "",
      notes: "",
      ...initialValues,
    },
  });

  const category = useWatch({ control, name: "category", defaultValue: "SINGLES" }) as FixtureFormValues["category"];
  const playerAId = useWatch({ control, name: "playerAId", defaultValue: "" });
  const playerBId = useWatch({ control, name: "playerBId", defaultValue: "" });

  useEffect(() => {
    if (mode === "edit") {
      return;
    }

    if (category === "SINGLES") {
      setValue("teamAId", "");
      setValue("teamBId", "");
      setValue("playerAId", "");
      setValue("playerBId", "");
    } else {
      setValue("playerAId", "");
      setValue("playerBId", "");
    }
  }, [category, mode, setValue]);

  async function onSubmit(values: FixtureFormValues) {
    await onSave(values);
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <label className="block text-sm">
        <span className="mb-2 block font-medium text-zinc-700">Category</span>
        <select className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4" {...register("category")}> 
          <option value="SINGLES">Singles</option>
          <option value="DOUBLES">Doubles</option>
          <option value="MIXED_DOUBLES">Mixed Doubles</option>
        </select>
        {errors.category && <p className="mt-2 text-sm text-red-500">{errors.category.message}</p>}
      </label>

      <label className="block text-sm">
        <span className="mb-2 block font-medium text-zinc-700">Sets per match</span>
        <select className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4" {...register("bestOf", { valueAsNumber: true })}>
          {[1, 3, 5].map((sets) => <option key={sets} value={sets}>{sets} set{sets === 1 ? "" : "s"}</option>)}
        </select>
        {errors.bestOf && <p className="mt-2 text-sm text-red-500">{errors.bestOf.message}</p>}
      </label>

      {mode === "create" ? (
        <div className="grid gap-4 md:grid-cols-2">
          {category === "SINGLES" ? <>
            <PlayerCombobox label="Player A" players={players} value={playerAId ?? ""} onChange={(playerId) => setValue("playerAId", playerId, { shouldValidate: true })} />
            <PlayerCombobox label="Player B" players={players} value={playerBId ?? ""} onChange={(playerId) => setValue("playerBId", playerId, { shouldValidate: true })} />
          </> : <>
            <label className="block text-sm"><span className="mb-2 block font-medium text-zinc-700">Team A</span><select className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4" {...register("teamAId")}><option value="">Select Team A</option>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label>
            <label className="block text-sm"><span className="mb-2 block font-medium text-zinc-700">Team B</span><select className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4" {...register("teamBId")}><option value="">Select Team B</option>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label>
          </>}
        </div>
      ) : null}

      {category === "SINGLES" && players.length === 0 ? (
        <p className="text-sm text-zinc-500">Register players on the <Link className="font-semibold text-emerald-600 hover:underline" href="/players">Players page</Link> before scheduling a Singles fixture.</p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <AuthInput label="Court (optional)" error={errors.court?.message} {...register("court")} />
        <AuthInput label="Match Date" type="date" error={errors.date?.message} {...register("date")} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <AuthInput label="Match Time" type="time" error={errors.time?.message} {...register("time")} />
        <AuthInput label="Notes (optional)" error={errors.notes?.message} {...register("notes")} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50">Cancel</button>
        <AuthButton type="submit" isLoading={isSubmitting}>Save Fixture</AuthButton>
      </div>
    </form>
  );
}
