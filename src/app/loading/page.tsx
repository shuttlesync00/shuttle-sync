import { AuthShell } from "@/components/auth/auth-shell";

export default function GlobalLoadingPage() {
  return (
    <AuthShell title="Loading" subtitle="Preparing your workspace.">
      <div className="flex flex-col items-center justify-center gap-4 py-6">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-500" />
        <p className="text-sm text-zinc-500">Loading...</p>
      </div>
    </AuthShell>
  );
}
