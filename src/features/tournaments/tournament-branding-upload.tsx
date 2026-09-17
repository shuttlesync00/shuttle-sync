"use client";

import { ImageIcon, Trash2, Upload } from "lucide-react";
import { useRef } from "react";

interface BrandingUploadProps {
  kind: "banner" | "logo";
  previewUrl: string | null;
  fileName: string | null;
  status: "processing" | "uploading" | null;
  error: string | null;
  onSelect: (file: File | null) => void;
  onRemove: () => void;
}

export function TournamentBrandingUpload({ kind, previewUrl, fileName, status, error, onSelect, onRemove }: BrandingUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const isBanner = kind === "banner";

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-zinc-700">Tournament {isBanner ? "Banner" : "Logo"}</p>
          <p className="mt-1 text-xs text-zinc-500">{isBanner ? "Wide image, ideally 3:1 or 4:1." : "Square image; transparent PNG supported."}</p>
        </div>
        {fileName ? <span className="max-w-[160px] truncate text-xs text-zinc-500">{fileName}</span> : null}
      </div>
      <div className={`relative flex items-center justify-center overflow-hidden rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 ${isBanner ? "aspect-[4/1]" : "aspect-square max-w-[220px]"}`}>
        {previewUrl ? <img src={previewUrl} alt={`${kind} preview`} className={`h-full w-full ${isBanner ? "object-cover" : "object-contain p-4"}`} /> : <div className="text-center text-zinc-400"><ImageIcon className="mx-auto h-8 w-8" /><p className="mt-2 text-sm">No {kind} selected</p></div>}
        {status ? <div className="absolute inset-0 flex items-center justify-center bg-white/80 text-sm font-semibold text-zinc-700">{status === "processing" ? "Preparing image..." : "Uploading..."}</div> : null}
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => { onSelect(event.target.files?.[0] ?? null); event.currentTarget.value = ""; }} />
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" disabled={status !== null} onClick={() => inputRef.current?.click()} className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"><Upload className="h-4 w-4" />{previewUrl ? `Replace ${isBanner ? "banner" : "logo"}` : `Upload ${isBanner ? "banner" : "logo"}`}</button>
        {previewUrl ? <button type="button" disabled={status !== null} onClick={onRemove} className="inline-flex items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"><Trash2 className="h-4 w-4" />Remove</button> : null}
      </div>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
