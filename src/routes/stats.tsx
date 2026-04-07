import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { PlayerAvatar } from "@/components/PlayerAvatar";

export const Route = createFileRoute("/stats")({
  component: StatsPage,
});

type PlayerStat = {
  player_id: string | null;
  name: string | null;
  avatar_url: string | null;
  matches_played: number | null;
  matches_won: number | null;
  avg_match_points: number | null;
  win_pct: number | null;
};

type TeamStat = {
  player1_id: string | null;
  player1_name: string | null;
  player2_id: string | null;
  player2_name: string | null;
  matches_played: number | null;
  avg_match_points: number | null;
};

type MatchDetail = {
  match_id: string | null;
  team1_score: number | null;
  team2_score: number | null;
  team1_player1_name: string | null;
  team1_player2_name: string | null;
  team2_player1_name: string | null;
  team2_player2_name: string | null;
  status: string | null;
};

function StatsPage() {
  const [playerStats, setPlayerStats] = useState<PlayerStat[]>([]);
  const [teamStats, setTeamStats] = useState<TeamStat[]>([]);
  const [avatarMap, setAvatarMap] = useState<Record<string, string | null>>({});
  const [bestMatch, setBestMatch] = useState<MatchDetail | null>(null);
  const [worstMatch, setWorstMatch] = useState<MatchDetail | null>(null);

  useEffect(() => {
    supabase
      .from("player_stats")
      .select("*")
      .gt("matches_played", 0)
      .then(({ data }) => {
        if (data) setPlayerStats(data as PlayerStat[]);
      });

    supabase
      .from("team_stats")
      .select("*")
      .gt("matches_played", 0)
      .then(({ data }) => {
        if (data) {
          const teams = data as TeamStat[];
          setTeamStats(teams);
          const ids = new Set<string>();
          teams.forEach((t) => {
            if (t.player1_id) ids.add(t.player1_id);
            if (t.player2_id) ids.add(t.player2_id);
          });
          if (ids.size > 0) {
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

    supabase
      .from("match_detail")
      .select("match_id, team1_score, team2_score, team1_player1_name, team1_player2_name, team2_player1_name, team2_player2_name, status")
      .eq("status", "completed")
      .then(({ data }) => {
        if (data && data.length > 0) {
          const matches = data as MatchDetail[];
          const sorted = [...matches].sort(
            (a, b) =>
              ((b.team1_score ?? 0) + (b.team2_score ?? 0)) -
              ((a.team1_score ?? 0) + (a.team2_score ?? 0))
          );
          setBestMatch(sorted[0]);
          setWorstMatch(sorted[sorted.length - 1]);
        }
      });
  }, []);

  if (playerStats.length === 0 && teamStats.length === 0) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="mx-auto max-w-5xl px-4 py-16 text-center text-muted-foreground">
          No stats yet — play some matches first!
        </div>
      </div>
    );
  }

  const bestPlayerAmp = [...playerStats].sort(
    (a, b) => (b.avg_match_points ?? 0) - (a.avg_match_points ?? 0)
  )[0];
  const worstPlayerAmp = [...playerStats].sort(
    (a, b) => (a.avg_match_points ?? 0) - (b.avg_match_points ?? 0)
  )[0];
  const bestPlayerWin = [...playerStats].sort(
    (a, b) => (b.win_pct ?? 0) - (a.win_pct ?? 0)
  )[0];
  const worstPlayerWin = [...playerStats].sort(
    (a, b) => (a.win_pct ?? 0) - (b.win_pct ?? 0)
  )[0];
  const bestTeamAmp = [...teamStats].sort(
    (a, b) => (b.avg_match_points ?? 0) - (a.avg_match_points ?? 0)
  )[0];
  const worstTeamAmp = [...teamStats].sort(
    (a, b) => (a.avg_match_points ?? 0) - (b.avg_match_points ?? 0)
  )[0];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Stats</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bestPlayerAmp && (
            <PlayerCard label="Best Player — AMP" player={bestPlayerAmp} stat={`AMP: ${Number(bestPlayerAmp.avg_match_points ?? 0).toFixed(1)}`} />
          )}
          {worstPlayerAmp && (
            <PlayerCard label="Worst Player — AMP" player={worstPlayerAmp} stat={`AMP: ${Number(worstPlayerAmp.avg_match_points ?? 0).toFixed(1)}`} />
          )}
          {bestPlayerWin && (
            <PlayerCard
              label="Best Player — Win %"
              player={bestPlayerWin}
              stat={`${bestPlayerWin.matches_played} played · ${bestPlayerWin.matches_won} won · ${Number(bestPlayerWin.win_pct ?? 0).toFixed(0)}%`}
            />
          )}
          {worstPlayerWin && (
            <PlayerCard
              label="Worst Player — Win %"
              player={worstPlayerWin}
              stat={`${worstPlayerWin.matches_played} played · ${worstPlayerWin.matches_won} won · ${Number(worstPlayerWin.win_pct ?? 0).toFixed(0)}%`}
            />
          )}
          {bestTeamAmp && (
            <TeamCard label="Best Team — AMP" team={bestTeamAmp} avatarMap={avatarMap} />
          )}
          {worstTeamAmp && (
            <TeamCard label="Worst Team — AMP" team={worstTeamAmp} avatarMap={avatarMap} />
          )}
          <MatchCard label="Best Match" match={bestMatch} />
          <MatchCard label="Worst Match" match={worstMatch} />
        </div>
      </div>
    </div>
  );
}

function PlayerCard({ label, player, stat }: { label: string; player: PlayerStat; stat: string }) {
  return (
    <div className="rounded-xl border bg-card p-5 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="flex items-center gap-3">
        <PlayerAvatar url={player.avatar_url} name={player.name} size={48} />
        <span className="text-lg font-bold">{player.name}</span>
      </div>
      <p className="text-sm text-muted-foreground">{stat}</p>
    </div>
  );
}

function TeamCard({
  label,
  team,
  avatarMap,
}: {
  label: string;
  team: TeamStat;
  avatarMap: Record<string, string | null>;
}) {
  return (
    <div className="rounded-xl border bg-card p-5 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="flex items-center gap-3">
        <div className="flex -space-x-2">
          <PlayerAvatar url={avatarMap[team.player1_id ?? ""] ?? null} name={team.player1_name} size={40} />
          <PlayerAvatar url={avatarMap[team.player2_id ?? ""] ?? null} name={team.player2_name} size={40} />
        </div>
        <span className="text-lg font-bold">
          {team.player1_name} & {team.player2_name}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">
        AMP: {Number(team.avg_match_points ?? 0).toFixed(1)}
      </p>
    </div>
  );
}

function MatchCard({ label, match }: { label: string; match: MatchDetail | null }) {
  return (
    <div className="rounded-xl border bg-card p-5 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      {match ? (
        <>
          <p className="text-2xl font-bold">
            {match.team1_score} – {match.team2_score}
          </p>
          <p className="text-sm text-muted-foreground">
            {match.team1_player1_name} & {match.team1_player2_name} vs {match.team2_player1_name} & {match.team2_player2_name}
          </p>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">No matches yet</p>
      )}
    </div>
  );
}