"use client";

import { ProfilePasswordEditor } from "@/features/profile/profile-password-editor";
import { ProfilePhotoEditor } from "@/features/profile/profile-photo-editor";
import type { AuthenticatedProfile, UserMatchSummary } from "@/services/profile-service";
import { MapPin } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface ProfileStats {
  matches: number;
  wins: number;
  losses: number;
  winPercentage: number;
  titles: number;
}

interface ProfilePageClientProps {
  profile: AuthenticatedProfile;
  stats: ProfileStats;
  recentMatches: UserMatchSummary[];
}

function formatMemberSince(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][date.getUTCMonth()];
  return `${month} ${date.getUTCFullYear()}`;
}

function formatMatchDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${month}/${day}/${date.getUTCFullYear()}`;
}

export function ProfilePageClient({ profile, stats, recentMatches }: ProfilePageClientProps) {
  const [profileImage, setProfileImage] = useState(profile.profileImage);
  const safeName = profile.name || "User";
  const initials = safeName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "U";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-600">Account</p>
        <h1 className="mt-2 text-3xl font-semibold text-zinc-900">Profile</h1>
        <p className="mt-2 text-sm text-zinc-500">Your Shuttle Sync account and badminton activity.</p>
      </div>

      <section className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)] sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-500/10 text-2xl font-semibold text-emerald-600 ring-4 ring-emerald-50">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt={safeName || "Profile"}
                  className="h-full w-full object-cover"
                  width={96}
                  height={96}
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <span aria-label="Profile initials">{initials}</span>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-zinc-900">{safeName}</h2>
              <div className="mt-2 flex items-center gap-2 text-sm text-zinc-500">
                <MapPin className="h-4 w-4" />
                <span>{profile.city && profile.country ? `${profile.city}, ${profile.country}` : "Location not provided"}</span>
              </div>
              <p className="mt-1 text-sm text-zinc-500">Member since {formatMemberSince(profile.memberSince)}</p>
            </div>
          </div>

          <ProfilePhotoEditor profile={profile} onPhotoUpdated={setProfileImage} />
        </div>
      </section>

      <section className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)] sm:p-8">
        <div className="mb-6">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-600">Profile details</p>
          <h2 className="mt-2 text-2xl font-semibold text-zinc-900">Personal information</h2>
        </div>
        <dl className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
          <div><dt className="text-sm text-zinc-500">Full name</dt><dd className="mt-1 font-semibold text-zinc-900">{profile.name || "Not available"}</dd></div>
          <div><dt className="text-sm text-zinc-500">Mobile number</dt><dd className="mt-1 font-semibold text-zinc-900">{profile.phoneNumber || "Not provided"}</dd></div>
          <div><dt className="text-sm text-zinc-500">Email</dt><dd className="mt-1 break-all font-semibold text-zinc-900">{profile.email || "Not available"}</dd></div>
          <div><dt className="text-sm text-zinc-500">Member since</dt><dd className="mt-1 font-semibold text-zinc-900">{formatMemberSince(profile.memberSince)}</dd></div>
        </dl>
      </section>

      <section className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)] sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-600">On-court record</p>
            <h2 className="mt-2 text-2xl font-semibold text-zinc-900">Playing statistics</h2>
          </div>
          <Link href="/profile/stats" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">View full stats →</Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {[
            ["Matches", stats.matches],
            ["Wins", stats.wins],
            ["Losses", stats.losses],
            ["Win %", `${stats.winPercentage.toFixed(0)}%`],
            ["Titles", stats.titles],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-3xl bg-zinc-50 p-5">
              <p className="text-sm text-zinc-500">{label}</p>
              <p className="mt-2 text-3xl font-semibold text-zinc-900">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)] sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-600">Activity</p>
            <h2 className="mt-2 text-2xl font-semibold text-zinc-900">Recent matches</h2>
          </div>
          <Link href="/matches" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">View all matches →</Link>
        </div>
        <div className="mt-6 divide-y divide-zinc-100">
          {recentMatches.length === 0 ? (
            <p className="rounded-2xl bg-zinc-50 px-4 py-5 text-sm text-zinc-500">No matches played yet.</p>
          ) : recentMatches.map((match) => (
            <div key={match.id} className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate font-semibold text-zinc-900">{match.homeName ?? "Unnamed side"} <span className="font-normal text-zinc-400">vs</span> {match.awayName ?? "Unnamed side"}</p>
                <p className="mt-1 text-sm text-zinc-500">{match.tournamentName ?? "One-off match"} · {match.category?.replaceAll("_", " ") ?? "Match"} · {formatMatchDate(match.playedAt)}</p>
              </div>
              <div className="flex items-center gap-4 sm:text-right">
                <span className="font-semibold text-zinc-900">{match.scoreHome} - {match.scoreAway}</span>
                <span className={`text-sm font-semibold ${match.userWon ? "text-emerald-600" : "text-red-600"}`}>{match.userWon ? "Win" : "Loss"}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <ProfilePasswordEditor />
    </div>
  );
}
