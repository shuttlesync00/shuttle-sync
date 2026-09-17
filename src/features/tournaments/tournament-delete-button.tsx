"use client";

import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface TournamentDeleteButtonProps {
  tournamentId: string;
  label?: string;
}

export function TournamentDeleteButton({ tournamentId, label = "Delete" }: TournamentDeleteButtonProps) {
  const router = useRouter();
  const { toast } = useToast();

  async function handleDelete() {
    if (!window.confirm("Delete this tournament and all related data?")) {
      return;
    }

    try {
      const response = await fetch(`/api/tournaments?id=${encodeURIComponent(tournamentId)}`, {
        method: "DELETE",
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to delete tournament.");
      }

      toast({ title: "Tournament deleted.", type: "success" });
      router.push("/tournaments");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to delete tournament.";
      toast({ title: message, type: "error" });
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      className="rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
    >
      {label}
    </button>
  );
}
