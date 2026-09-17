import { FixtureWorkspace } from "@/features/fixtures/fixture-workspace";

interface TournamentFixturesPageProps {
  params: Promise<{ tournamentId: string }>;
}

export default async function TournamentFixturesPage({ params }: TournamentFixturesPageProps) {
  const { tournamentId } = await params;

  return (
    <div className="space-y-6">
      <FixtureWorkspace tournamentId={tournamentId} />
    </div>
  );
}
