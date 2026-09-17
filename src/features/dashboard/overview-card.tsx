export function OverviewCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <p className="text-sm text-zinc-400">{title}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}
