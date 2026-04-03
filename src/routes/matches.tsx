import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Minus, Plus } from "lucide-react";

export const Route = createFileRoute("/matches")({
  component: MatchesPage,
});

type Player = { id: string; name: string; avatar_url: string | null };
type MatchDetail = {
  match_id: string | null;
  played_at: string | null;
  status: string | null;
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
};

function MatchesPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<MatchDetail[]>([]);
  const [t1p1, setT1p1] = useState("");
  const [t1p2, setT1p2] = useState("");
  const [t2p1, setT2p1] = useState("");
  const [t2p2, setT2p2] = useState("");
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const selected = [t1p1, t1p2, t2p1, t2p2].filter(Boolean);

  const fetchMatches = useCallback(async () => {
    const { data } = await supabase
      .from("match_detail")
      .select("*")
      .order("played_at", { ascending: false });
    if (data) setMatches(data);
  }, []);

  useEffect(() => {
    supabase
      .from("players")
      .select("id, name, avatar_url")
      .order("name")
      .then(({ data }) => {
        if (data) setPlayers(data);
      });
    fetchMatches();
  }, [fetchMatches]);

  const playerMap = Object.fromEntries(players.map((p) => [p.id, p]));

  const availableFor = (current: string) =>
    players.filter((p) => p.id === current || !selected.includes(p.id));

  const clampScore = (v: number) => Math.max(0, Math.min(30, v));

  const handleSubmit = async () => {
    if (!t1p1 || !t1p2 || !t2p1 || !t2p2) {
      toast.error("Select all 4 players");
      return;
    }
    if (score1 === score2) {
      toast.error("Scores cannot be tied");
      return;
    }
    setSubmitting(true);
    try {
      const winning_team = score1 > score2 ? 1 : 2;
      const { data: match, error } = await supabase
        .from("matches")
        .insert({
          status: "completed" as const,
          team1_score: score1,
          team2_score: score2,
          winning_team,
        })
        .select("id")
        .single();
      if (error) throw error;

      const mpRows = [
        { match_id: match.id, player_id: t1p1, team_number: 1 },
        { match_id: match.id, player_id: t1p2, team_number: 1 },
        { match_id: match.id, player_id: t2p1, team_number: 2 },
        { match_id: match.id, player_id: t2p2, team_number: 2 },
      ];
      const { error: mpErr } = await supabase
        .from("match_players")
        .insert(mpRows);
      if (mpErr) throw mpErr;

      toast.success("Match recorded!");
      setT1p1("");
      setT1p2("");
      setT2p1("");
      setT2p2("");
      setScore1(0);
      setScore2(0);
      fetchMatches();
    } catch (e: any) {
      toast.error(e.message || "Failed to submit match");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const totalMatches = matches.length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-10">
        {/* Section A — Create New Match */}
        <section>
          <h1 className="text-2xl font-bold mb-6">New Match</h1>
          <div className="rounded-xl border bg-card p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Team 1 */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Team 1
                </h3>
                <PlayerSelect
                  value={t1p1}
                  onChange={setT1p1}
                  players={availableFor(t1p1)}
                  placeholder="Player 1"
                />
                <PlayerSelect
                  value={t1p2}
                  onChange={setT1p2}
                  players={availableFor(t1p2)}
                  placeholder="Player 2"
                />
              </div>
              {/* Team 2 */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Team 2
                </h3>
                <PlayerSelect
                  value={t2p1}
                  onChange={setT2p1}
                  players={availableFor(t2p1)}
                  placeholder="Player 1"
                />
                <PlayerSelect
                  value={t2p2}
                  onChange={setT2p2}
                  players={availableFor(t2p2)}
                  placeholder="Player 2"
                />
              </div>
            </div>

            {/* Score */}
            <div className="flex items-center justify-center gap-6">
              <ScoreInput value={score1} onChange={(v) => setScore1(clampScore(v))} label="Team 1" />
              <span className="text-xl font-bold text-muted-foreground pt-5">–</span>
              <ScoreInput value={score2} onChange={(v) => setScore2(clampScore(v))} label="Team 2" />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={submitting || !t1p1 || !t1p2 || !t2p1 || !t2p2}
              className="w-full"
              size="lg"
            >
              {submitting ? "Submitting…" : "Submit Match"}
            </Button>
          </div>
        </section>

        {/* Section B — Match History */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Match History</h2>
          {matches.length === 0 ? (
            <p className="text-muted-foreground">No matches yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-3 py-2.5 text-left font-medium text-muted-foreground w-10">
                      #
                    </th>
                    <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">
                      Team 1
                    </th>
                    <th className="px-3 py-2.5 text-center font-medium text-muted-foreground w-20">
                      Score
                    </th>
                    <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">
                      Team 2
                    </th>
                    <th className="px-3 py-2.5 text-right font-medium text-muted-foreground w-16">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {matches.map((m, i) => {
                    const matchNum = totalMatches - i;
                    const t1Won = m.winning_team === 1;
                    const t2Won = m.winning_team === 2;
                    return (
                      <tr
                        key={m.match_id}
                        className={i % 2 === 0 ? "bg-background" : "bg-muted/30"}
                      >
                        <td className="px-3 py-2.5 text-muted-foreground font-mono text-xs">
                          {matchNum}
                        </td>
                        <td className={`px-3 py-2.5 ${t1Won ? "font-semibold" : ""}`}>
                          <TeamCell
                            p1={playerMap[m.team1_player1_id ?? ""]}
                            p2={playerMap[m.team1_player2_id ?? ""]}
                            name1={m.team1_player1_name}
                            name2={m.team1_player2_name}
                          />
                        </td>
                        <td className="px-3 py-2.5 text-center tabular-nums">
                          <span className={t1Won ? "font-bold" : "text-muted-foreground"}>
                            {m.team1_score}
                          </span>
                          <span className="text-muted-foreground mx-1">–</span>
                          <span className={t2Won ? "font-bold" : "text-muted-foreground"}>
                            {m.team2_score}
                          </span>
                        </td>
                        <td className={`px-3 py-2.5 ${t2Won ? "font-semibold" : ""}`}>
                          <TeamCell
                            p1={playerMap[m.team2_player1_id ?? ""]}
                            p2={playerMap[m.team2_player2_id ?? ""]}
                            name1={m.team2_player1_name}
                            name2={m.team2_player2_name}
                          />
                        </td>
                        <td className="px-3 py-2.5 text-right text-muted-foreground text-xs">
                          {formatDate(m.played_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function PlayerSelect({
  value,
  onChange,
  players,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  players: Player[];
  placeholder: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {players.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            <div className="flex items-center gap-2">
              <PlayerAvatar url={p.avatar_url} name={p.name} size={24} />
              <span>{p.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ScoreInput({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onChange(value - 1)}
          disabled={value <= 0}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <input
          type="number"
          min={0}
          max={30}
          value={value}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10);
            if (!isNaN(n)) onChange(Math.max(0, Math.min(30, n)));
          }}
          className="w-12 h-8 text-center text-lg font-bold border rounded-lg bg-background [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onChange(value + 1)}
          disabled={value >= 30}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

function TeamCell({
  p1,
  p2,
  name1,
  name2,
}: {
  p1?: Player;
  p2?: Player;
  name1: string | null;
  name2: string | null;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        <PlayerAvatar url={p1?.avatar_url ?? null} name={name1} size={28} />
        <PlayerAvatar url={p2?.avatar_url ?? null} name={name2} size={28} />
      </div>
      <span className="truncate text-xs sm:text-sm">
        {name1 ?? "?"} & {name2 ?? "?"}
      </span>
    </div>
  );
}
