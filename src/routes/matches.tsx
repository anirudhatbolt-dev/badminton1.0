import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/matches")({
  component: MatchesPage,
});

function MatchesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Matches</h1>
        <p className="text-muted-foreground">Coming soon</p>
      </div>
    </div>
  );
}
