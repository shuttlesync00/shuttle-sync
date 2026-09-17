"use client";

import { uploadProfileImage } from "@/services/auth-service";
import type { AuthenticatedProfile } from "@/services/profile-service";
import { Camera, ImageIcon, Upload } from "lucide-react";
import { useRef, useState } from "react";

export function ProfilePhotoEditor({
  profile,
  onPhotoUpdated,
}: {
  profile: AuthenticatedProfile;
  onPhotoUpdated: (url: string | null) => void;
}) {
  const [photoMessage, setPhotoMessage] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const safeName = profile.name || "User";

  async function handlePhotoSelect(file: File | null) {
    if (!file) return;
    setPhotoMessage(null);
    setIsUploadingPhoto(true);

    try {
      const result = await uploadProfileImage(file);
      if (result.error || !result.url) {
        throw new Error(result.error?.message ?? "Unable to upload profile photo.");
      }
      onPhotoUpdated(result.url);
      setShowPhotoOptions(false);
      setPhotoMessage("Profile photo updated.");
    } catch (error) {
      setPhotoMessage(error instanceof Error ? error.message : "Unable to upload profile photo.");
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  return (
    <div className="relative">
      <div className="mt-4 sm:mt-0">
        <button
          type="button"
          aria-label={`Edit profile photo for ${safeName}`}
          onClick={() => setShowPhotoOptions((open) => !open)}
          disabled={isUploadingPhoto}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-60 sm:w-auto"
        >
          <Upload className="h-4 w-4" />
          {isUploadingPhoto ? "Uploading..." : "Edit profile photo"}
        </button>
        {showPhotoOptions ? (
          <div className="absolute left-0 top-16 z-10 w-52 rounded-2xl border border-zinc-200 bg-white p-2 shadow-[0_16px_40px_rgba(15,23,42,0.15)]">
            <button type="button" onClick={() => cameraInputRef.current?.click()} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-zinc-700 hover:bg-zinc-50">
              <Camera className="h-4 w-4" />
              Take photo
            </button>
            <button type="button" onClick={() => galleryInputRef.current?.click()} className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-zinc-700 hover:bg-zinc-50">
              <ImageIcon className="h-4 w-4" />
              Choose from gallery
            </button>
          </div>
        ) : null}
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(event) => void handlePhotoSelect(event.target.files?.[0] ?? null)} />
        <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => void handlePhotoSelect(event.target.files?.[0] ?? null)} />
      </div>
      {photoMessage ? <p className={`mt-4 text-sm ${photoMessage.includes("updated") ? "text-emerald-600" : "text-red-600"}`}>{photoMessage}</p> : null}
    </div>
  );
}
