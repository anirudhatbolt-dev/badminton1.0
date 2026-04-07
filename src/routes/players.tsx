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

export const Route = createFileRoute("/players")({
  component: PlayersPage,
});

type Player = { id: string; name: string; avatar_url: string | null };

type PlayerStatRow = {
  player_id: string | null;
  name: string | null;
  matches_played: number | null;
  matches_won: number | null;
  matches_lost: number | null;
  win_pct: number | null;
  avg_match_points: number | null;
};

type PartnerStatRow = {
  partner_id: string | null;
  partner_name: string | null;
  matches_together: number | null;
  wins_together: number | null;
  losses_together: number | null;
  win_pct_together: number | null;
};

type OpponentStatRow = {
  opponent_id: string | null;
  opponent_name: string | null;
  matches_vs: number | null;
  wins_vs: number | null;
  losses_vs: number | null;
  win_pct_vs: number | null;
};

type BestWorstMatch = {
  player_id: string | null;
  best_match_id: string | null;
  best_their_score: number | null;
  best_opp_score: number | null;
  worst_match_id: string | null;
  worst_their_score: number | null;
  worst_opp_score: number | null;
};

type MatchDetail = {
  match_id: string | null;
  team1_player1_name: string | null;
  team1_player2_name: string | null;
  team2_player1_name: string | null;
  team2_player2_name: string | null;
  team1_player1_id: string | null;
  team1_player2_id: string | null;
  team2_player1_id: string | null;
  team2_player2_id: string | null;
};

type ModalData = {
  stats: PlayerStatRow | null;
  bestPartner: PartnerStatRow | null;
  worstPartner: PartnerStatRow | null;
  bestOpponent: OpponentStatRow | null;
  worstOpponent: OpponentStatRow | null;
  bestWorst: BestWorstMatch | null;
  bestMatchDetail: MatchDetail | null;
  worstMatchDetail: MatchDetail | null;
};

function StatItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-border/50 last:border-0">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="font-semibold text-sm">{value}</span>
    </div>
  );
}

function RelationCard({
  label,
  name,
  avatarUrl,
  stats,
}: {
  label: string;
  name: string | null;
  avatarUrl: string | null;
  stats: { label: string; value: string | number }[];
}) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground mb-2">{label}</p>
      <div className="flex items-center gap-2 mb-2">
        <PlayerAvatar url={avatarUrl} name={name} size={32} />
        <span className="font-medium text-sm">{name ?? "—"}</span>
      </div>
      {stats.map((s) => (
        <StatItem key={s.label} label={s.label} value={s.value} />
      ))}
    </div>
  );
}

function getOpponentTeamNames(detail: MatchDetail | null, playerId: string): string {
  if (!detail) return "—";
  const isTeam1 =
    detail.team1_player1_id === playerId || detail.team1_player2_id === playerId;
  if (isTeam1) {
    return [detail.team2_player1_name, detail.team2_player2_name].filter(Boolean).join(" & ");
  }
  return [detail.team1_player1_name, detail.team1_player2_name].filter(Boolean).join(" & ");
}

function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selected, setSelected] = useState<Player | null>(null);
  const [modalData, setModalData] = useState<ModalData | null>(null);
  const [loading, setLoading] = useState(false);
  const [avatarMap, setAvatarMap] = useState<Record<string, string | null>>({});
  const [topAmpId, setTopAmpId] = useState<string | null>(null);
  const [topWinPctId, setTopWinPctId] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("players")
      .select("id, name, avatar_url")
      .order("name")
      .then(({ data }) => {
        if (data) {
          setPlayers(data);
          const map: Record<string, string | null> = {};
          data.forEach((p) => (map[p.id] = p.avatar_url));
          setAvatarMap(map);
        }
      });

    supabase
      .from("player_stats")
      .select("player_id, avg_match_points, win_pct, matches_played")
      .then(({ data }) => {
        if (data) {
          const active = (data as PlayerStatRow[]).filter((s) => (s.matches_played ?? 0) > 0);
          if (active.length) {
            const bestAmp = active.reduce((a, b) =>
              (b.avg_match_points ?? 0) > (a.avg_match_points ?? 0) ? b : a
            );
            const bestWin = active.reduce((a, b) =>
              (b.win_pct ?? 0) > (a.win_pct ?? 0) ? b : a
            );
            setTopAmpId(bestAmp.player_id ?? null);
            setTopWinPctId(bestWin.player_id ?? null);
          }
        }
      });
  }, []);

  const openModal = async (player: Player) => {
    setSelected(player);
    setLoading(true);
    setModalData(null);

    const [statsRes, partnersRes, opponentsRes, bwRes] = await Promise.all([
      supabase.from("player_stats").select("*").eq("player_id", player.id).maybeSingle(),
      supabase.from("player_partner_stats").select("*").eq("player_id", player.id),
      supabase.from("player_opponent_stats").select("*").eq("player_id", player.id),
      supabase.from("player_best_worst_matches").select("*").eq("player_id", player.id).maybeSingle(),
    ]);

    const partners = (partnersRes.data ?? []) as PartnerStatRow[];
    const opponents = (opponentsRes.data ?? []) as OpponentStatRow[];
    const bw = bwRes.data as BestWorstMatch | null;

    const bestPartner = partners.length
      ? partners.reduce((a, b) => ((b.win_pct_together ?? 0) > (a.win_pct_together ?? 0) ? b : a))
      : null;
    const worstPartner = partners.length
      ? partners.reduce((a, b) => ((b.win_pct_together ?? 0) < (a.win_pct_together ?? 0) ? b : a))
      : null;
    const bestOpponent = opponents.length
      ? opponents.reduce((a, b) => ((b.win_pct_vs ?? 0) > (a.win_pct_vs ?? 0) ? b : a))
      : null;
    const worstOpponent = opponents.length
      ? opponents.reduce((a, b) => ((b.win_pct_vs ?? 0) < (a.win_pct_vs ?? 0) ? b : a))
      : null;

    let bestMatchDetail: MatchDetail | null = null;
    let worstMatchDetail: MatchDetail | null = null;

    const matchIds = [bw?.best_match_id, bw?.worst_match_id].filter(Boolean) as string[];
    if (matchIds.length) {
      const { data: details } = await supabase
        .from("match_detail")
        .select("*")
        .in("match_id", matchIds);
      if (details) {
        bestMatchDetail = (details as MatchDetail[]).find((d) => d.match_id === bw?.best_match_id) ?? null;
        worstMatchDetail = (details as MatchDetail[]).find((d) => d.match_id === bw?.worst_match_id) ?? null;
      }
    }

    setModalData({
      stats: statsRes.data as PlayerStatRow | null,
      bestPartner,
      worstPartner,
      bestOpponent,
      worstOpponent,
      bestWorst: bw,
      bestMatchDetail,
      worstMatchDetail,
    });
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Players</h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {players.map((p) => (
            <button
              key={p.id}
              onClick={() => openModal(p)}
              className="flex flex-col items-center gap-3 rounded-xl border bg-card p-6 hover:bg-accent/50 transition-colors cursor-pointer"
            >
              <PlayerAvatar url={p.avatar_url} name={p.name} size={96} />
              <span className="font-medium text-base text-center">{p.name}</span>
              {(topAmpId === p.id || topWinPctId === p.id) && (
                <div className="flex items-center gap-1 flex-wrap justify-center">
                  {topAmpId === p.id && (
                    <span className="text-xs px-2 py-0.5 rounded-full border border-border bg-muted text-muted-foreground font-medium">#1 AMP</span>
                  )}
                  {topWinPctId === p.id && (
                    <span className="text-xs px-2 py-0.5 rounded-full border border-border bg-muted text-muted-foreground font-medium">#1 Win %</span>
                  )}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <PlayerAvatar url={selected.avatar_url} name={selected.name} size={48} />
                  <DialogTitle>{selected.name}</DialogTitle>
                </div>
              </DialogHeader>

              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : modalData ? (
                <div className="space-y-4 mt-2">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground mb-2">Overview</p>
                    <StatItem label="Matches Played" value={modalData.stats?.matches_played ?? 0} />
                    <StatItem label="Matches Won" value={modalData.stats?.matches_won ?? 0} />
                    <StatItem label="Matches Lost" value={modalData.stats?.matches_lost ?? 0} />
                    <StatItem
                      label="Win %"
                      value={modalData.stats?.win_pct != null ? `${Number(modalData.stats.win_pct).toFixed(0)}%` : "—"}
                    />
                    <StatItem
                      label="Avg Match Points"
                      value={modalData.stats?.avg_match_points != null ? Number(modalData.stats.avg_match_points).toFixed(1) : "—"}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {modalData.bestPartner && (
                      <RelationCard
                        label="Plays Best With"
                        name={modalData.bestPartner.partner_name}
                        avatarUrl={avatarMap[modalData.bestPartner.partner_id ?? ""] ?? null}
                        stats={[
                          { label: "Matches", value: modalData.bestPartner.matches_together ?? 0 },
                          { label: "Wins", value: modalData.bestPartner.wins_together ?? 0 },
                          { label: "Win %", value: modalData.bestPartner.win_pct_together != null ? `${Number(modalData.bestPartner.win_pct_together).toFixed(0)}%` : "—" },
                        ]}
                      />
                    )}
                    {modalData.worstPartner && (
                      <RelationCard
                        label="Plays Worst With"
                        name={modalData.worstPartner.partner_name}
                        avatarUrl={avatarMap[modalData.worstPartner.partner_id ?? ""] ?? null}
                        stats={[
                          { label: "Matches", value: modalData.worstPartner.matches_together ?? 0 },
                          { label: "Losses", value: modalData.worstPartner.losses_together ?? 0 },
                          { label: "Win %", value: modalData.worstPartner.win_pct_together != null ? `${Number(modalData.worstPartner.win_pct_together).toFixed(0)}%` : "—" },
                        ]}
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {modalData.bestOpponent && (
                      <RelationCard
                        label="Plays Best Against"
                        name={modalData.bestOpponent.opponent_name}
                        avatarUrl={avatarMap[modalData.bestOpponent.opponent_id ?? ""] ?? null}
                        stats={[
                          { label: "Matches", value: modalData.bestOpponent.matches_vs ?? 0 },
                          { label: "Wins", value: modalData.bestOpponent.wins_vs ?? 0 },
                          { label: "Win %", value: modalData.bestOpponent.win_pct_vs != null ? `${Number(modalData.bestOpponent.win_pct_vs).toFixed(0)}%` : "—" },
                        ]}
                      />
                    )}
                    {modalData.worstOpponent && (
                      <RelationCard
                        label="Plays Worst Against"
                        name={modalData.worstOpponent.opponent_name}
                        avatarUrl={avatarMap[modalData.worstOpponent.opponent_id ?? ""] ?? null}
                        stats={[
                          { label: "Matches", value: modalData.worstOpponent.matches_vs ?? 0 },
                          { label: "Losses", value: modalData.worstOpponent.losses_vs ?? 0 },
                          { label: "Win %", value: modalData.worstOpponent.win_pct_vs != null ? `${Number(modalData.worstOpponent.win_pct_vs).toFixed(0)}%` : "—" },
                        ]}
                      />
                    )}
                  </div>

                  {modalData.bestWorst && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="rounded-lg border p-3">
                        <p className="text-xs text-muted-foreground mb-1">Best Match</p>
                        <p className="text-lg font-bold">
                          {modalData.bestWorst.best_their_score} – {modalData.bestWorst.best_opp_score}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          vs {getOpponentTeamNames(modalData.bestMatchDetail, selected.id)}
                        </p>
                      </div>
                      <div className="rounded-lg border p-3">
                        <p className="text-xs text-muted-foreground mb-1">Worst Match</p>
                        <p className="text-lg font-bold">
                          {modalData.bestWorst.worst_their_score} – {modalData.bestWorst.worst_opp_score}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          vs {getOpponentTeamNames(modalData.worstMatchDetail, selected.id)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
