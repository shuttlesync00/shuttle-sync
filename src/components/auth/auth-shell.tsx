"use client";


interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,#f8fafc_0%,#eef2f7_100%)] px-4 py-10 text-zinc-900 sm:px-6 lg:px-8">
      <div className="w-full max-w-[420px] rounded-[32px] border border-zinc-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-2xl font-semibold text-emerald-600">
            SS
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Shuttle Sync</h1>
          <p className="mt-2 text-sm text-zinc-500">Every Match. Every Player. Every Rally.</p>
        </div>
        <div className="mb-6 text-center">
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="mt-2 text-sm text-zinc-500">{subtitle}</p>
        </div>
        {children}
        {footer ? <div className="mt-6 text-center text-sm text-zinc-500">{footer}</div> : null}
      </div>
    </div>
  );
}
