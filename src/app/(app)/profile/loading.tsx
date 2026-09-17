export default function ProfileLoading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="h-20 animate-pulse rounded-[32px] bg-white/70" />
      <div className="h-48 animate-pulse rounded-[32px] bg-white/70" />
      <div className="h-64 animate-pulse rounded-[32px] bg-white/70" />
    </div>
  );
}
