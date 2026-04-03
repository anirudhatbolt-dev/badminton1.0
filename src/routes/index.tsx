import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { User, Menu, X, Trophy, Percent, Users } from "lucide-react";

export const Route = createFileRoute("/")({
  component: HomePage,
});

const NAV_LINKS = [
  { label: "Rankings", to: "/" as const },
  { label: "Players", to: "/players" as const },
  { label: "Teams", to: "/teams" as const },
  { label: "Matches", to: "/matches" as const },
];

type PlayerStat = {
  player_id: string | null;
  name: string | null;
  avatar_url: string | null;
  matches_played: number | null;
  matches_won: number | null;
  matches_lost: number | null;
  avg_match_points: number | null;
  win_pct: number | null;
};

type PartnerRanking = {
  player_id: string | null;
  player_name: string | null;
  matches_together: number | null;
  wins_together: number | null;
  losses_together: number | null;
  win_pct_together: number | null;
};

function PlayerAvatar({ url, name }: { url: string | null; name: string | null }) {
  const [error, setError] = useState(false);
  if (url && !error) {
    return (
      <img
        src={url}
        alt={name ?? "Player"}
        className="w-9 h-9 rounded-full object-cover shrink-0"
        onError={() => setError(true)}
      />
    );
  }
  return (
    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
      <User className="w-5 h-5 text-muted-foreground" />
    </div>
  );
}

function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link to="/" className="text-xl font-extrabold tracking-tight">
          Gigaminton
        </Link>

        <div className="hidden md:flex gap-6">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              activeProps={{ className: "text-sm font-medium text-foreground" }}
              activeOptions={{ exact: true }}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <button
          className="md:hidden p-2 -mr-2"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden fixed inset-0 top-14 z-40 bg-background/95 backdrop-blur">
          <div className="flex flex-col gap-2 p-6">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="text-lg font-medium py-2 text-muted-foreground hover:text-foreground"
                activeProps={{ className: "text-lg font-medium py-2 text-foreground" }}
                activeOptions={{ exact: true }}
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}

function HomePage() {
  const [playerStats, setPlayerStats] = useState<PlayerStat[]>([]);
  const [mihirStats, setMihirStats] = useState<(PartnerRanking & { avatar_url?: string | null })[]>([]);
  const [avatarMap, setAvatarMap] = useState<Record<string, string | null>>({});

  useEffect(() => {
    supabase
      .from("player_stats")
      .select("*")
      .then(({ data }) => {
        if (data) setPlayerStats(data as PlayerStat[]);
      });

    supabase
      .from("partner_filtered_ranking")
      .select("*")
      .eq("partner_name", "Mihir")
      .then(({ data }) => {
        if (data) {
          const rankings = data as PartnerRanking[];
          setMihirStats(rankings);
          const ids = rankings.map((r) => r.player_id).filter(Boolean) as string[];
          if (ids.length) {
            supabase
              .from("players")
              .select("id, avatar_url")
              .in("id", ids)
              .then(({ data: players }) => {
                if (players) {
                  const map: Record<string, string | null> = {};
                  players.forEach((p) => (map[p.id] = p.avatar_url));
                  setAvatarMap(map);
                }
              });
          }
        }
      });
  }, []);

  const statsByAmp = [...playerStats].sort(
    (a, b) => (b.avg_match_points ?? 0) - (a.avg_match_points ?? 0)
  );
  const statsByWin = [...playerStats].sort(
    (a, b) => (b.win_pct ?? 0) - (a.win_pct ?? 0)
  );
  const mihirSorted = [...mihirStats].sort(
    (a, b) => (b.wins_together ?? 0) - (a.wins_together ?? 0)
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <section className="mx-auto max-w-5xl px-4 py-12 flex flex-col items-center text-center gap-6">
        <img
          src="https://oyrmjcztuwcnulkwjscl.supabase.co/storage/v1/object/public/Badminton/Gigachad-Transparent.png"
          alt="Gigachad Badminton"
          className="w-full max-w-md"
        />
        <h1 className="text-3xl md:text-4xl font-extrabold leading-tight">
          Welcome Chad, play like you would put the Bad in Badminton
        </h1>
        <p className="text-muted-foreground max-w-xl">
          This website tracks Badminton metrics in a way that you would feel more
          of an athlete just seeing your name here even when you play absolutely
          Ass.
        </p>
        <Link
          to="/matches"
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
        >
          Create Match
        </Link>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-16">
        <h2 className="text-2xl font-bold mb-4">Rankings</h2>
        <Tabs defaultValue="amp">
          <TabsList className="mb-4">
            <TabsTrigger value="amp" className="gap-1.5">
              <Trophy className="w-4 h-4" /> AMP
            </TabsTrigger>
            <TabsTrigger value="winpct" className="gap-1.5">
              <Percent className="w-4 h-4" /> Win %
            </TabsTrigger>
            <TabsTrigger value="mihir" className="gap-1.5">
              <Users className="w-4 h-4" /> Wins with Mihir
            </TabsTrigger>
          </TabsList>

          <TabsContent value="amp">
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead className="text-right">Matches</TableHead>
                    <TableHead className="text-right">AMP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statsByAmp.map((p) => (
                    <TableRow key={p.player_id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <PlayerAvatar url={p.avatar_url} name={p.name} />
                          <span className="font-medium">{p.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{p.matches_played ?? 0}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {p.avg_match_points != null ? Number(p.avg_match_points).toFixed(1) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="winpct">
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead className="text-right">Played</TableHead>
                    <TableHead className="text-right">Won</TableHead>
                    <TableHead className="text-right">Win %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statsByWin.map((p) => (
                    <TableRow key={p.player_id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <PlayerAvatar url={p.avatar_url} name={p.name} />
                          <span className="font-medium">{p.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{p.matches_played ?? 0}</TableCell>
                      <TableCell className="text-right">{p.matches_won ?? 0}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {p.win_pct != null ? `${Number(p.win_pct).toFixed(0)}%` : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="mihir">
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead className="text-right">Played</TableHead>
                    <TableHead className="text-right">Won</TableHead>
                    <TableHead className="text-right">Win %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mihirSorted.map((p) => (
                    <TableRow key={p.player_id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <PlayerAvatar
                            url={avatarMap[p.player_id ?? ""] ?? null}
                            name={p.player_name}
                          />
                          <span className="font-medium">{p.player_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{p.matches_together ?? 0}</TableCell>
                      <TableCell className="text-right">{p.wins_together ?? 0}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {p.win_pct_together != null
                          ? `${Number(p.win_pct_together).toFixed(0)}%`
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
