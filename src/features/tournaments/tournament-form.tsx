"use client";

import { AuthButton } from "@/components/auth/auth-button";
import { AuthInput } from "@/components/auth/auth-input";
import { TournamentBrandingUpload } from "@/features/tournaments/tournament-branding-upload";
import { useToast } from "@/hooks/use-toast";
import { optimizeTournamentBrandingImage, type TournamentBrandingKind as BrandingKind } from "@/lib/image-optimization";
import { tournamentSchema, type TournamentFormValues } from "@/lib/validations/tournament";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";

const categories = ["SINGLES", "DOUBLES", "MIXED_DOUBLES"] as const;
const types = ["OPEN", "CORPORATE", "COMMUNITY", "COLLEGE", "UNIVERSITY", "SCHOOL", "SERIES", "OTHER"] as const;
const shuttles = ["PLASTIC", "FEATHER"] as const;
const MAX_FILE_SIZE = 8 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function TournamentForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [branding, setBranding] = useState<Record<BrandingKind, File | null>>({ banner: null, logo: null });
  const [previews, setPreviews] = useState<Record<BrandingKind, string | null>>({ banner: null, logo: null });
  const [brandingErrors, setBrandingErrors] = useState<Record<BrandingKind, string | null>>({ banner: null, logo: null });
  const [processingKind, setProcessingKind] = useState<BrandingKind | null>(null);
  const [uploadingKind, setUploadingKind] = useState<BrandingKind | null>(null);
  const { register, handleSubmit, setValue, control, formState: { errors, isSubmitting } } = useForm<TournamentFormValues>({
    resolver: zodResolver(tournamentSchema),
    defaultValues: { name: "", city: "", ground: "", organizerName: "", organizerPhone: "", organizerEmail: "", startDate: "", endDate: "", type: "OPEN", matchCategories: [], shuttleType: "PLASTIC", description: "", bestOf: 3 },
  });
  const selectedCategories = useWatch({ control, name: "matchCategories", defaultValue: [] }) as TournamentFormValues["matchCategories"];
  const tournamentName = useWatch({ control, name: "name" });

  function toggleCategory(value: (typeof categories)[number]) {
    const next = selectedCategories.includes(value) ? selectedCategories.filter((item) => item !== value) : [...selectedCategories, value];
    setValue("matchCategories", next, { shouldValidate: true });
  }

  async function handleBrandingSelect(kind: BrandingKind, file: File | null) {
    if (!file) return;
    if (!IMAGE_TYPES.has(file.type)) {
      setBrandingErrors((current) => ({ ...current, [kind]: "Please select a JPG, PNG, or WebP image." }));
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setBrandingErrors((current) => ({ ...current, [kind]: "Branding images must be smaller than 8 MB." }));
      return;
    }
    setProcessingKind(kind);
    try {
      const optimizedFile = await optimizeTournamentBrandingImage(file, kind);
      setBrandingErrors((current) => ({ ...current, [kind]: null }));
      setBranding((current) => ({ ...current, [kind]: optimizedFile }));
      setPreviews((current) => ({ ...current, [kind]: URL.createObjectURL(optimizedFile) }));
    } catch (error) {
      setBrandingErrors((current) => ({ ...current, [kind]: error instanceof Error ? error.message : "Unable to process this image." }));
    } finally {
      setProcessingKind(null);
    }
  }

  function removeBranding(kind: BrandingKind) {
    setBranding((current) => ({ ...current, [kind]: null }));
    setPreviews((current) => ({ ...current, [kind]: null }));
    setBrandingErrors((current) => ({ ...current, [kind]: null }));
  }

  async function uploadBranding(tournamentId: string, kind: BrandingKind, file: File) {
    setUploadingKind(kind);
    const formData = new FormData();
    formData.append("kind", kind);
    formData.append("file", file);
    const response = await fetch(`/api/tournaments/${tournamentId}/branding`, { method: "POST", body: formData });
    const payload = await response.json().catch(() => null) as { error?: string } | null;
    setUploadingKind(null);
    if (!response.ok) throw new Error(payload?.error ?? `${kind === "banner" ? "Banner" : "Logo"} upload failed. Please try again.`);
  }

  async function onSubmit(values: TournamentFormValues) {
    try {
      const response = await fetch("/api/tournaments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      const payload = await response.json().catch(() => null) as { id?: string; error?: string } | null;
      if (!response.ok || !payload?.id) throw new Error(payload?.error ?? "Unable to create tournament.");

      try {
        if (branding.banner) await uploadBranding(payload.id, "banner", branding.banner);
        if (branding.logo) await uploadBranding(payload.id, "logo", branding.logo);
      } catch (error) {
        await fetch(`/api/tournaments?id=${payload.id}`, { method: "DELETE" });
        throw error;
      }

      toast({ title: "Tournament created", type: "success" });
      router.push(`/tournaments/${payload.id}/setup`);
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "Unable to create tournament.", type: "error" });
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <TournamentBrandingUpload kind="banner" previewUrl={previews.banner} fileName={branding.banner?.name ?? null} status={processingKind === "banner" ? "processing" : uploadingKind === "banner" ? "uploading" : null} error={brandingErrors.banner} onSelect={(file) => { void handleBrandingSelect("banner", file); }} onRemove={() => removeBranding("banner")} />
          <TournamentBrandingUpload kind="logo" previewUrl={previews.logo} fileName={branding.logo?.name ?? null} status={processingKind === "logo" ? "processing" : uploadingKind === "logo" ? "uploading" : null} error={brandingErrors.logo} onSelect={(file) => { void handleBrandingSelect("logo", file); }} onRemove={() => removeBranding("logo")} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2"><AuthInput label="Tournament Name" error={errors.name?.message} {...register("name")} /><AuthInput label="City" error={errors.city?.message} {...register("city")} /></div>
      <div className="grid gap-4 md:grid-cols-2"><AuthInput label="Ground" error={errors.ground?.message} {...register("ground")} /><AuthInput label="Organizer Name" error={errors.organizerName?.message} {...register("organizerName")} /></div>
      <div className="grid gap-4 md:grid-cols-2"><AuthInput label="Organizer Phone" error={errors.organizerPhone?.message} {...register("organizerPhone")} /><AuthInput label="Organizer Email" type="email" error={errors.organizerEmail?.message} {...register("organizerEmail")} /></div>
      <div className="grid gap-4 md:grid-cols-2"><AuthInput label="Tournament Start Date" type="date" error={errors.startDate?.message} {...register("startDate")} /><AuthInput label="Tournament End Date" type="date" error={errors.endDate?.message} {...register("endDate")} /></div>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="block text-sm"><span className="mb-2 block font-medium text-zinc-700">Tournament Type</span><select className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-base" {...register("type")}>{types.map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
        <label className="block text-sm"><span className="mb-2 block font-medium text-zinc-700">Shuttle Type</span><select className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-base" {...register("shuttleType")}>{shuttles.map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
        <label className="block text-sm"><span className="mb-2 block font-medium text-zinc-700">Sets per match</span><select className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-base" {...register("bestOf", { valueAsNumber: true })}>{[1, 3, 5].map((sets) => <option key={sets} value={sets}>{sets} set{sets === 1 ? "" : "s"}</option>)}</select></label>
      </div>
      <div><p className="mb-2 text-sm font-medium text-zinc-700">Match Categories</p><div className="flex flex-wrap gap-2">{categories.map((category) => { const active = selectedCategories.includes(category); return <button key={category} type="button" onClick={() => toggleCategory(category)} className={`rounded-full px-3 py-2 text-sm font-medium transition ${active ? "bg-emerald-500 text-white" : "bg-zinc-100 text-zinc-700"}`}>{category}</button>; })}</div>{errors.matchCategories ? <p className="mt-2 text-sm text-red-500">{errors.matchCategories.message}</p> : null}</div>
      <label className="block text-sm"><span className="mb-2 block font-medium text-zinc-700">Description</span><textarea rows={4} className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-base" {...register("description")} /></label>
      <AuthButton type="submit" isLoading={isSubmitting || processingKind !== null || uploadingKind !== null}>Create Tournament</AuthButton>
    </form>
  );
}
