"use client";

import { UserRound } from "lucide-react";
import Image from "next/image";

interface PlayerAvatarProps {
  name: string;
  photoUrl?: string | null;
  size?: "sm" | "md" | "lg";
}

export function PlayerAvatar({ name, photoUrl, size = "md" }: PlayerAvatarProps) {
  const sizeClass = size === "sm" ? "h-10 w-10" : size === "lg" ? "h-16 w-16" : "h-12 w-12";
  const dimension = size === "sm" ? 40 : size === "lg" ? 64 : 48;

  if (photoUrl) {
    return (
      <Image
        src={photoUrl}
        alt={name}
        width={dimension}
        height={dimension}
        className={`${sizeClass} rounded-full object-cover`}
        unoptimized
      />
    );
  }

  return (
    <div className={`${sizeClass} flex items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600`}>
      <UserRound size={size === "lg" ? 24 : 18} />
    </div>
  );
}
