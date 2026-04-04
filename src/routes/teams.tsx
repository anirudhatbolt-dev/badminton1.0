import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from "@/components/ui/table";
import { Loader2, Trophy, Percent } from "lucide-react";

export const Route = createFileRoute("/teams")({
  component: TeamsPage,
});

type TeamStat = {
  player1_id: string | null;
  player2_id: string | null;
  player1_name: string | null;
  player2_name: string | null;
  matches_played: number | null;
  matches_won: number | null;
  matches_lost: number | null;
  win_pct: number | null;
  avg_match_points: number | null;
  best_margin: number | null;
  worst_margin: number | null;
};

type TeamOpponentStat = {
  team_player1_id: string | null;
  team_player2_id: string | null;
  opp_player1_id: string | null;
  opp_player2_id: string | null;
  opp_player1_name: string | null;
  opp_player2_name: string | null;
  matches_vs: number | null;
  wins_vs: number | null;
  losses_vs: number | null;
  win_pct_vs: number | null;
};

type MatchDetailRow = {
  match_id: string | null;
  team1_player1_id: string | null;
  team1_player2_id: string | null;
  team2_player1_id: string | null;
  team2_player2_id: string | null;
  team1_player1_name: string | null;
  team1_player2_name: string | null;
  team2_player1_name: string | null;
  team2_player2_name: string | null;
  team1_score: number | null;
  team2_score: number | null;
};

type BestWorstGame = {
  theirScore: number;
  oppScore: number;
  oppNames: string;
} | null;

function StatItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-border/50 last:border-0">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="font-semibold text-sm">{value}</span>
    </div>
  );
}

function computeBestWorst(
  matches: MatchDetailRow[],
  p1Id: string,
  p2Id: string
): { best: BestWorstGame; worst: BestWorstGame } {
  const teamMatches: { theirScore: number; oppScore: number; oppNames: string; margin: number }[] = [];

  for (const m of matches) {
    const t1ids = new Set([m.team1_player1_id, m.team1_player2_id]);
    const t2ids = new Set([m.team2_player1_id, m.team2_player2_id]);

    if (t1ids.has(p1Id) && t1ids.has(p2Id) && m.team1_score != null && m.team2_score != null) {
      teamMatches.push({
        theirScore: m.team1_score,
        oppScore: m.team2_score,
        oppNames: [m.team2_player1_name, m.team2_player2_name].filter(Boolean).join(" & "),
        margin: m.team1_score - m.team2_score,
      });
    } else if (t2ids.has(p1Id) && t2ids.has(p2Id) && m.team1_score != null && m.team2_score != null) {
      teamMatches.push({
        theirScore: m.team2_score,
        oppScore: m.team1_score,
        oppNames: [m.team1_player1_name, m.team1_player2_name].filter(Boolean).join(" & "),
        margin: m.team2_score - m.team1_score,
      });
    }
  }

  if (!teamMatches.length) return { best: null, worst: null };

  const best = teamMatches.reduce((a, b) => (b.margin > a.margin ? b : a));
  const worst = teamMatches.reduce((a, b) => (b.margin < a.margin ? b : a));

  return {
    best: { theirScore: best.theirScore, oppScore: best.oppScore, oppNames: best.oppNames },
    worst: { theirScore: worst.theirScore, oppScore: worst.oppScore, oppNames: worst.oppNames },
  };
}

function TeamsPage() {
  const [teams, setTeams] = useState<TeamStat[]>([]);
  const [avatarMap, setAvatarMap] = useState<Record<string, string | null>>({});
  const [selected, setSelected] = useState<TeamStat | null>(null);
  const [oppData, setOppData] = useState<{ best: TeamOpponentStat | null; worst: TeamOpponentStat | null } | null>(null);
  const [bestWorst, setBestWorst] = useState<{ best: BestWorstGame; worst: BestWorstGame } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase
      .from("team_stats")
      .select("*")
      .then(({ data }) => {
        if (data) {
          setTeams(data as TeamStat[]);
          const ids = new Set<string>();
          (data as TeamStat[]).forEach((t) => {
            if (t.player1_id) ids.add(t.player1_id);
            if (t.player2_id) ids.add(t.player2_id);
          });
          if (ids.size) {
            supabase
              .from("players")
              .select("id, avatar_url")
              .in("id", [...ids])
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

  const openModal = async (team: TeamStat) => {
    setSelected(team);
    setLoading(true);
    setOppData(null);
    setBestWorst(null);

    const [oppRes, matchRes] = await Promise.all([
      supabase
        .from("team_opponent_stats")
        .select("*")
        .eq("team_player1_id", team.player1_id!)
        .eq("team_player2_id", team.player2_id!),
      supabase
        .from("match_detail")
        .select("*")
        .or(`team1_player1_id.eq.${team.player1_id},team1_player2_id.eq.${team.player1_id},team2_player1_id.eq.${team.player1_id},team2_player2_id.eq.${team.player1_id}`),
    ]);

    const rows = (oppRes.data ?? []) as TeamOpponentStat[];
    const best = rows.length
      ? rows.reduce((a, b) => ((b.wins_vs ?? 0) > (a.wins_vs ?? 0) ? b : a))
      : null;
    const worst = rows.length
      ? rows.reduce((a, b) => ((b.losses_vs ?? 0) > (a.losses_vs ?? 0) ? b : a))
      : null;

    setOppData({ best, worst });

    const allMatches = (matchRes.data ?? []) as MatchDetailRow[];
    const bw = computeBestWorst(allMatches, team.player1_id!, team.player2_id!);
    setBestWorst(bw);

    setLoading(false);
  };

  const teamsByAmp = [...teams].sort((a, b) => (b.avg_match_points ?? 0) - (a.avg_match_points ?? 0));
  const teamsByWin = [...teams].sort((a, b) => (b.win_pct ?? 0) - (a.win_pct ?? 0));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Teams</h1>

        {/* Rankings Section */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4">Rankings</h2>
          <Tabs defaultValue="amp">
            <TabsList className="mb-4">
              <TabsTrigger value="amp" className="gap-1.5"><Trophy className="w-4 h-4" /> AMP</TabsTrigger>
              <TabsTrigger value="winpct" className="gap-1.5"><Percent className="w-4 h-4" /> Win %</TabsTrigger>
            </TabsList>

            <TabsContent value="amp">
              <div className="rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead className="text-right">Matches</TableHead>
                      <TableHead className="text-right">AMP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamsByAmp.map((t, i) => (
                      <TableRow key={`${t.player1_id}-${t.player2_id}`}>
                        <TableCell className="font-medium">{i + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex -space-x-2">
                              <PlayerAvatar url={avatarMap[t.player1_id ?? ""] ?? null} name={t.player1_name} size={36} />
                              <PlayerAvatar url={avatarMap[t.player2_id ?? ""] ?? null} name={t.player2_name} size={36} />
                            </div>
                            <span className="font-medium text-sm">{t.player1_name} & {t.player2_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{t.matches_played ?? 0}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {t.avg_match_points != null ? Number(t.avg_match_points).toFixed(1) : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="winpct">
              <div className="rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead className="text-right">Played</TableHead>
                      <TableHead className="text-right">Won</TableHead>
                      <TableHead className="text-right">Win %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamsByWin.map((t, i) => (
                      <TableRow key={`${t.player1_id}-${t.player2_id}`}>
                        <TableCell className="font-medium">{i + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex -space-x-2">
                              <PlayerAvatar url={avatarMap[t.player1_id ?? ""] ?? null} name={t.player1_name} size={36} />
                              <PlayerAvatar url={avatarMap[t.player2_id ?? ""] ?? null} name={t.player2_name} size={36} />
                            </div>
                            <span className="font-medium text-sm">{t.player1_name} & {t.player2_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{t.matches_played ?? 0}</TableCell>
                        <TableCell className="text-right">{t.matches_won ?? 0}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {t.win_pct != null ? `${Number(t.win_pct).toFixed(0)}%` : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </section>

        {/* Team Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {teams.map((t) => {
            const key = `${t.player1_id}-${t.player2_id}`;
            return (
              <button
                key={key}
                onClick={() => openModal(t)}
                className="flex items-center gap-3 rounded-xl border bg-card p-4 hover:bg-accent/50 transition-colors cursor-pointer"
              >
                <div className="flex -space-x-3">
                  <PlayerAvatar url={avatarMap[t.player1_id ?? ""] ?? null} name={t.player1_name} size={60} />
                  <PlayerAvatar url={avatarMap[t.player2_id ?? ""] ?? null} name={t.player2_name} size={60} />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">{t.player1_name}</p>
                  <p className="font-medium text-sm">{t.player2_name}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    <PlayerAvatar url={avatarMap[selected.player1_id ?? ""] ?? null} name={selected.player1_name} size={40} />
                    <PlayerAvatar url={avatarMap[selected.player2_id ?? ""] ?? null} name={selected.player2_name} size={40} />
                  </div>
                  <DialogTitle>
                    {selected.player1_name} & {selected.player2_name}
                  </DialogTitle>
                </div>
              </DialogHeader>

              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4 mt-2">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground mb-2">Overview</p>
                    <StatItem label="Matches Played" value={selected.matches_played ?? 0} />
                    <StatItem label="Matches Won" value={selected.matches_won ?? 0} />
                    <StatItem label="Matches Lost" value={selected.matches_lost ?? 0} />
                    <StatItem
                      label="Win %"
                      value={selected.win_pct != null ? `${Number(selected.win_pct).toFixed(0)}%` : "—"}
                    />
                    <StatItem
                      label="Avg Match Points"
                      value={selected.avg_match_points != null ? Number(selected.avg_match_points).toFixed(1) : "—"}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground mb-1">Best Game</p>
                      {bestWorst?.best ? (
                        <>
                          <p className="text-lg font-bold">
                            {bestWorst.best.theirScore} – {bestWorst.best.oppScore}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            vs {bestWorst.best.oppNames}
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground">No matches played yet</p>
                      )}
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground mb-1">Worst Game</p>
                      {bestWorst?.worst ? (
                        <>
                          <p className="text-lg font-bold">
                            {bestWorst.worst.theirScore} – {bestWorst.worst.oppScore}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            vs {bestWorst.worst.oppNames}
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground">No matches played yet</p>
                      )}
                    </div>
                  </div>

                  {oppData && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {oppData.best && (
                        <div className="rounded-lg border p-3">
                          <p className="text-xs text-muted-foreground mb-2">Plays Best Against</p>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex -space-x-2">
                              <PlayerAvatar url={avatarMap[oppData.best.opp_player1_id ?? ""] ?? null} name={oppData.best.opp_player1_name} size={28} />
                              <PlayerAvatar url={avatarMap[oppData.best.opp_player2_id ?? ""] ?? null} name={oppData.best.opp_player2_name} size={28} />
                            </div>
                            <span className="text-xs font-medium">
                              {oppData.best.opp_player1_name} & {oppData.best.opp_player2_name}
                            </span>
                          </div>
                          <StatItem label="Matches" value={oppData.best.matches_vs ?? 0} />
                          <StatItem label="Wins" value={oppData.best.wins_vs ?? 0} />
                          <StatItem
                            label="Win %"
                            value={oppData.best.win_pct_vs != null ? `${Number(oppData.best.win_pct_vs).toFixed(0)}%` : "—"}
                          />
                        </div>
                      )}
                      {oppData.worst && (
                        <div className="rounded-lg border p-3">
                          <p className="text-xs text-muted-foreground mb-2">Plays Worst Against</p>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex -space-x-2">
                              <PlayerAvatar url={avatarMap[oppData.worst.opp_player1_id ?? ""] ?? null} name={oppData.worst.opp_player1_name} size={28} />
                              <PlayerAvatar url={avatarMap[oppData.worst.opp_player2_id ?? ""] ?? null} name={oppData.worst.opp_player2_name} size={28} />
                            </div>
                            <span className="text-xs font-medium">
                              {oppData.worst.opp_player1_name} & {oppData.worst.opp_player2_name}
                            </span>
                          </div>
                          <StatItem label="Matches" value={oppData.worst.matches_vs ?? 0} />
                          <StatItem label="Losses" value={oppData.worst.losses_vs ?? 0} />
                          <StatItem
                            label="Win %"
                            value={oppData.worst.win_pct_vs != null ? `${Number(oppData.worst.win_pct_vs).toFixed(0)}%` : "—"}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
