"use client";

import Link from "next/link";

interface TournamentSetupWorkflowProps {
  teamCount: number;
  rosterReadyCount: number;
  fixtureCount: number;
  tournamentStarted: boolean;
  nextStepLabel: string;
  nextStepHref: string;
}

export function TournamentSetupWorkflow({ teamCount, rosterReadyCount, fixtureCount, tournamentStarted, nextStepLabel, nextStepHref }: TournamentSetupWorkflowProps) {
  const steps = [
    { label: "Tournament created", done: true, description: "Tournament workspace is ready." },
    { label: "Teams added", done: teamCount > 0, description: teamCount > 0 ? `${teamCount} team${teamCount === 1 ? "" : "s"} added` : "Add teams for the event." },
    { label: "Rosters complete", done: teamCount > 0 && rosterReadyCount === teamCount, description: rosterReadyCount === teamCount ? "Every team has a valid roster." : `${rosterReadyCount}/${teamCount} team${teamCount === 1 ? "" : "s"} ready` },
    { label: "Fixtures generated", done: fixtureCount > 0, description: fixtureCount > 0 ? `${fixtureCount} fixture${fixtureCount === 1 ? "" : "s"} scheduled` : "Generate or add fixtures." },
    { label: "Tournament started", done: tournamentStarted, description: tournamentStarted ? "The first fixture is live." : "Start the competition when the setup is complete." },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-600">Tournament workflow</p>
        <h2 className="mt-3 text-3xl font-semibold text-zinc-900">Next steps for this event</h2>
        <p className="mt-2 text-sm text-zinc-500">The guided setup helps you move from tournament creation to teams, players, schedule, and scoring.</p>
      </div>

      <div className="grid gap-4">
        {steps.map((step) => (
          <div key={step.label} className="rounded-[28px] border border-zinc-200 bg-zinc-50 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-zinc-900">{step.label}</p>
                <p className="mt-2 text-sm text-zinc-500">{step.description}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${step.done ? "bg-emerald-500 text-white" : "bg-zinc-200 text-zinc-600"}`}>
                {step.done ? "Done" : "Pending"}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-[32px] border border-zinc-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-600">Next action</p>
          <h3 className="mt-2 text-xl font-semibold text-zinc-900">{nextStepLabel}</h3>
        </div>
        <Link href={nextStepHref} className="rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600">
          {fixtureCount > 0 ? "Start Tournament" : "Continue"}
        </Link>
      </div>
    </div>
  );
}
