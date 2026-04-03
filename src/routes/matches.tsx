import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";

export const Route = createFileRoute("/matches")({
  component: MatchesPage,
});

function MatchesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-2">Matches</h1>
        <p className="text-muted-foreground">Coming soon</p>
      </div>
    </div>
  );
}
