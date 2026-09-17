"use client";

import { optimizeTournamentBrandingImage, type TournamentBrandingKind as BrandingKind } from "@/lib/image-optimization";
import { ImageIcon, PencilLine } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

interface TournamentBrandingEditorProps {
  tournamentId: string;
  hasBanner: boolean;
  hasLogo: boolean;
}

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function TournamentBrandingEditor({ tournamentId, hasBanner, hasLogo }: TournamentBrandingEditorProps) {
  const router = useRouter();
  const bannerInputRef = useRef<HTMLInputElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<{ kind: BrandingKind; phase: "processing" | "uploading" } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSelect(kind: BrandingKind, file: File | null) {
    if (!file) return;
    setError(null);
    if (!IMAGE_TYPES.has(file.type)) {
      setError("Please select a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("Branding images must be smaller than 8 MB.");
      return;
    }

    try {
      setStatus({ kind, phase: "processing" });
      const optimizedFile = await optimizeTournamentBrandingImage(file, kind);
      setStatus({ kind, phase: "uploading" });
      const formData = new FormData();
      formData.append("kind", kind);
      formData.append("file", optimizedFile);
      const response = await fetch(`/api/tournaments/${tournamentId}/branding`, { method: "POST", body: formData });
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(payload?.error ?? `${kind === "banner" ? "Banner" : "Logo"} replacement failed.`);
      setIsOpen(false);
      router.refresh();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Branding replacement failed.");
    } finally {
      setStatus(null);
    }
  }

  return (
    <div className="relative">
      <button type="button" onClick={() => { setError(null); setIsOpen((open) => !open); }} className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50">
        <PencilLine className="h-4 w-4" />
        Edit branding
      </button>
      {isOpen ? (
        <div className="absolute right-0 top-12 z-30 w-64 rounded-2xl border border-zinc-200 bg-white p-3 text-left shadow-[0_16px_40px_rgba(15,23,42,0.15)]">
          <p className="px-2 pb-2 text-xs font-medium uppercase tracking-[0.15em] text-emerald-600">Replace media</p>
          <button type="button" disabled={status !== null} onClick={() => bannerInputRef.current?.click()} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60">
            <ImageIcon className="h-4 w-4" />
            {status?.kind === "banner" ? `${status.phase === "processing" ? "Preparing" : "Uploading"} banner...` : hasBanner ? "Replace banner" : "Upload banner"}
          </button>
          <button type="button" disabled={status !== null} onClick={() => logoInputRef.current?.click()} className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60">
            <ImageIcon className="h-4 w-4" />
            {status?.kind === "logo" ? `${status.phase === "processing" ? "Preparing" : "Uploading"} logo...` : hasLogo ? "Replace logo" : "Upload logo"}
          </button>
          {error ? <p className="mt-2 px-2 text-xs text-red-600">{error}</p> : null}
          <input ref={bannerInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => { void handleSelect("banner", event.target.files?.[0] ?? null); event.currentTarget.value = ""; }} />
          <input ref={logoInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => { void handleSelect("logo", event.target.files?.[0] ?? null); event.currentTarget.value = ""; }} />
        </div>
      ) : null}
    </div>
  );
}
