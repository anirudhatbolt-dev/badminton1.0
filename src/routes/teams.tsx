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
import { Loader2 } from "lucide-react";

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

function StatItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-border/50 last:border-0">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="font-semibold text-sm">{value}</span>
    </div>
  );
}

function TeamsPage() {
  const [teams, setTeams] = useState<TeamStat[]>([]);
  const [avatarMap, setAvatarMap] = useState<Record<string, string | null>>({});
  const [selected, setSelected] = useState<TeamStat | null>(null);
  const [oppData, setOppData] = useState<{ best: TeamOpponentStat | null; worst: TeamOpponentStat | null } | null>(null);
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

    const { data } = await supabase
      .from("team_opponent_stats")
      .select("*")
      .eq("team_player1_id", team.player1_id!)
      .eq("team_player2_id", team.player2_id!);

    const rows = (data ?? []) as TeamOpponentStat[];
    const best = rows.length
      ? rows.reduce((a, b) => ((b.wins_vs ?? 0) > (a.wins_vs ?? 0) ? b : a))
      : null;
    const worst = rows.length
      ? rows.reduce((a, b) => ((b.losses_vs ?? 0) > (a.losses_vs ?? 0) ? b : a))
      : null;

    setOppData({ best, worst });
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Teams</h1>
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
                      <p className="text-lg font-bold">+{selected.best_margin ?? 0}</p>
                      <p className="text-xs text-muted-foreground">score margin</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground mb-1">Worst Game</p>
                      <p className="text-lg font-bold">{selected.worst_margin ?? 0}</p>
                      <p className="text-xs text-muted-foreground">score margin</p>
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
