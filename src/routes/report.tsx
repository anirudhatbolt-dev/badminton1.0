import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { format, parseISO } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/report")({
  component: ReportPage,
});

type MatchDetail = {
  match_id: string | null;
  played_at: string | null;
  team1_player1_id: string | null;
  team1_player1_name: string | null;
  team1_player2_id: string | null;
  team1_player2_name: string | null;
  team2_player1_id: string | null;
  team2_player1_name: string | null;
  team2_player2_id: string | null;
  team2_player2_name: string | null;
  team1_score: number | null;
  team2_score: number | null;
  winning_team: number | null;
  status: string | null;
};

type Player = { id: string; name: string; avatar_url: string | null };

type DayStat = {
  playerId: string;
  name: string;
  avatarUrl: string | null;
  matchesPlayed: number;
  matchesWon: number;
  totalPoints: number;
  amp: number;
  winPct: number;
};

type DayTeamStat = {
  p1Id: string;
  p2Id: string;
  p1Name: string;
  p2Name: string;
  p1Avatar: string | null;
  p2Avatar: string | null;
  matchesPlayed: number;
  matchesWon: number;
  winPct: number;
};

function ReportPage() {
  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayMatches, setDayMatches] = useState<MatchDetail[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase
      .from("players")
      .select("id, name, avatar_url")
      .then(({ data }) => {
        if (data) setPlayers(data);
      });

    supabase
      .from("matches")
      .select("played_at")
      .eq("status", "completed")
      .order("played_at", { ascending: false })
      .then(({ data }) => {
        if (data) {
          const dateSet = new Set<string>();
          data.forEach((m) => {
            if (m.played_at) {
              const d = m.played_at.substring(0, 10);
              dateSet.add(d);
            }
          });
          setDates([...dateSet].sort().reverse());
        }
      });
  }, []);

  const playerMap = Object.fromEntries(players.map((p) => [p.id, p]));

  const openDate = async (dateStr: string) => {
    setSelectedDate(dateStr);
    setLoading(true);
    const startOfDay = `${dateStr}T00:00:00`;
    const endOfDay = `${dateStr}T23:59:59.999`;
    const { data } = await supabase
      .from("match_detail")
      .select("*")
      .eq("status", "completed")
      .gte("played_at", startOfDay)
      .lte("played_at", endOfDay);
    setDayMatches((data as MatchDetail[]) ?? []);
    setLoading(false);
  };

  // Compute day stats
  const computeDayStats = () => {
    if (dayMatches.length === 0) return { playerStats: [] as DayStat[], teamStats: [] as DayTeamStat[] };

    const pMap: Record<string, { matchesPlayed: number; matchesWon: number; totalPoints: number }> = {};

    const addPlayer = (id: string | null, score: number, won: boolean) => {
      if (!id) return;
      if (!pMap[id]) pMap[id] = { matchesPlayed: 0, matchesWon: 0, totalPoints: 0 };
      pMap[id].matchesPlayed++;
      pMap[id].totalPoints += score;
      if (won) pMap[id].matchesWon++;
    };

    const tMap: Record<string, { matchesPlayed: number; matchesWon: number }> = {};

    const addTeam = (id1: string | null, id2: string | null, won: boolean) => {
      if (!id1 || !id2) return;
      const key = [id1, id2].sort().join("|");
      if (!tMap[key]) tMap[key] = { matchesPlayed: 0, matchesWon: 0 };
      tMap[key].matchesPlayed++;
      if (won) tMap[key].matchesWon++;
    };

    dayMatches.forEach((m) => {
      const s1 = m.team1_score ?? 0;
      const s2 = m.team2_score ?? 0;
      const t1Won = m.winning_team === 1;
      const t2Won = m.winning_team === 2;

      addPlayer(m.team1_player1_id, s1, t1Won);
      addPlayer(m.team1_player2_id, s1, t1Won);
      addPlayer(m.team2_player1_id, s2, t2Won);
      addPlayer(m.team2_player2_id, s2, t2Won);

      addTeam(m.team1_player1_id, m.team1_player2_id, t1Won);
      addTeam(m.team2_player1_id, m.team2_player2_id, t2Won);
    });

    const playerStats: DayStat[] = Object.entries(pMap).map(([id, s]) => {
      const p = playerMap[id];
      return {
        playerId: id,
        name: p?.name ?? "Unknown",
        avatarUrl: p?.avatar_url ?? null,
        matchesPlayed: s.matchesPlayed,
        matchesWon: s.matchesWon,
        totalPoints: s.totalPoints,
        amp: s.matchesPlayed > 0 ? s.totalPoints / s.matchesPlayed : 0,
        winPct: s.matchesPlayed > 0 ? (s.matchesWon / s.matchesPlayed) * 100 : 0,
      };
    });

    const teamStats: DayTeamStat[] = Object.entries(tMap).map(([key, s]) => {
      const [id1, id2] = key.split("|");
      const p1 = playerMap[id1];
      const p2 = playerMap[id2];
      return {
        p1Id: id1,
        p2Id: id2,
        p1Name: p1?.name ?? "Unknown",
        p2Name: p2?.name ?? "Unknown",
        p1Avatar: p1?.avatar_url ?? null,
        p2Avatar: p2?.avatar_url ?? null,
        matchesPlayed: s.matchesPlayed,
        matchesWon: s.matchesWon,
        winPct: s.matchesPlayed > 0 ? (s.matchesWon / s.matchesPlayed) * 100 : 0,
      };
    });

    return { playerStats, teamStats };
  };

  const { playerStats: dayPlayerStats, teamStats: dayTeamStats } = computeDayStats();
  const enoughPlayers = dayPlayerStats.length >= 2;
  const enoughTeams = dayTeamStats.length >= 2;

  const bestPlayerAmp = enoughPlayers
    ? [...dayPlayerStats].sort((a, b) => b.amp - a.amp)[0]
    : null;
  const worstPlayerAmp = enoughPlayers
    ? [...dayPlayerStats].sort((a, b) => a.amp - b.amp)[0]
    : null;
  const bestPlayerWin = enoughPlayers
    ? [...dayPlayerStats].sort((a, b) => b.winPct - a.winPct)[0]
    : null;
  const worstPlayerWin = enoughPlayers
    ? [...dayPlayerStats].sort((a, b) => a.winPct - b.winPct)[0]
    : null;
  const bestTeamWin = enoughTeams
    ? [...dayTeamStats].sort((a, b) => b.winPct - a.winPct)[0]
    : null;
  const worstTeamWin = enoughTeams
    ? [...dayTeamStats].sort((a, b) => a.winPct - b.winPct)[0]
    : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Report Card</h1>

        {dates.length === 0 ? (
          <p className="text-muted-foreground">No completed matches yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {dates.map((d) => (
              <button
                key={d}
                onClick={() => openDate(d)}
                className="px-4 py-2 rounded-full text-sm font-medium border bg-card hover:bg-accent transition-colors"
              >
                {format(parseISO(d), "MMMM d")}
              </button>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selectedDate} onOpenChange={(open) => !open && setSelectedDate(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDate && format(parseISO(selectedDate), "MMMM d")} — Report Card
            </DialogTitle>
          </DialogHeader>

          {loading ? (
            <p className="text-muted-foreground py-4">Loading…</p>
          ) : !enoughPlayers ? (
            <p className="text-muted-foreground py-4">Not enough data</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              {bestPlayerAmp && (
                <DayPlayerCard
                  label="Best Player — AMP"
                  stat={bestPlayerAmp}
                  detail={`AMP: ${bestPlayerAmp.amp.toFixed(1)}`}
                />
              )}
              {worstPlayerAmp && (
                <DayPlayerCard
                  label="Worst Player — AMP"
                  stat={worstPlayerAmp}
                  detail={`AMP: ${worstPlayerAmp.amp.toFixed(1)}`}
                />
              )}
              {bestPlayerWin && (
                <DayPlayerCard
                  label="Best Player — Win %"
                  stat={bestPlayerWin}
                  detail={`${bestPlayerWin.matchesPlayed} played · ${bestPlayerWin.matchesWon} won · ${bestPlayerWin.winPct.toFixed(0)}%`}
                />
              )}
              {worstPlayerWin && (
                <DayPlayerCard
                  label="Worst Player — Win %"
                  stat={worstPlayerWin}
                  detail={`${worstPlayerWin.matchesPlayed} played · ${worstPlayerWin.matchesWon} won · ${worstPlayerWin.winPct.toFixed(0)}%`}
                />
              )}
              {bestTeamWin && (
                <DayTeamCard label="Best Team — Win %" team={bestTeamWin} />
              )}
              {worstTeamWin ? (
                <DayTeamCard label="Worst Team — Win %" team={worstTeamWin} />
              ) : !enoughTeams ? (
                <div className="rounded-xl border bg-card p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Team Stats</p>
                  <p className="text-sm text-muted-foreground mt-2">Not enough data</p>
                </div>
              ) : null}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DayPlayerCard({ label, stat, detail }: { label: string; stat: DayStat; detail: string }) {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="flex items-center gap-3">
        <PlayerAvatar url={stat.avatarUrl} name={stat.name} size={40} />
        <span className="text-base font-bold">{stat.name}</span>
      </div>
      <p className="text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}

function DayTeamCard({ label, team }: { label: string; team: DayTeamStat }) {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="flex items-center gap-3">
        <div className="flex -space-x-2">
          <PlayerAvatar url={team.p1Avatar} name={team.p1Name} size={36} />
          <PlayerAvatar url={team.p2Avatar} name={team.p2Name} size={36} />
        </div>
        <span className="text-base font-bold">{team.p1Name} & {team.p2Name}</span>
      </div>
      <p className="text-sm text-muted-foreground">
        {team.matchesPlayed} played · {team.matchesWon} won · {team.winPct.toFixed(0)}%
      </p>
    </div>
  );
}
