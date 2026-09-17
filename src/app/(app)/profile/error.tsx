"use client";

export default function ProfileError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="rounded-[32px] border border-red-200 bg-white p-8 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-red-600">Profile unavailable</p>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">We could not load your profile.</h1>
      <p className="mt-2 text-sm text-zinc-500">Check your connection and try again. No placeholder account data was used.</p>
      <button type="button" onClick={() => reset()} className="mt-6 rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-600">Try again</button>
    </div>
  );
}
