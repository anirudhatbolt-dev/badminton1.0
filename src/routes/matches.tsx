import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Minus, Plus, Pencil } from "lucide-react";

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
  const { session } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<MatchDetail[]>([]);
  const [t1p1, setT1p1] = useState("");
  const [t1p2, setT1p2] = useState("");
  const [t2p1, setT2p1] = useState("");
  const [t2p2, setT2p2] = useState("");
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Edit modal state
  const [editMatch, setEditMatch] = useState<MatchDetail | null>(null);
  const [editT1p1, setEditT1p1] = useState("");
  const [editT1p2, setEditT1p2] = useState("");
  const [editT2p1, setEditT2p1] = useState("");
  const [editT2p2, setEditT2p2] = useState("");
  const [editScore1, setEditScore1] = useState(0);
  const [editScore2, setEditScore2] = useState(0);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const selected = [t1p1, t1p2, t2p1, t2p2].filter(Boolean);
  const editSelected = [editT1p1, editT1p2, editT2p1, editT2p2].filter(Boolean);

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

  const editAvailableFor = (current: string) =>
    players.filter((p) => p.id === current || !editSelected.includes(p.id));

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

  const openEditModal = (m: MatchDetail) => {
    setEditMatch(m);
    setEditT1p1(m.team1_player1_id ?? "");
    setEditT1p2(m.team1_player2_id ?? "");
    setEditT2p1(m.team2_player1_id ?? "");
    setEditT2p2(m.team2_player2_id ?? "");
    setEditScore1(m.team1_score ?? 0);
    setEditScore2(m.team2_score ?? 0);
  };

  const handleEditSave = async () => {
    if (!editMatch?.match_id) return;
    if (!editT1p1 || !editT1p2 || !editT2p1 || !editT2p2) {
      toast.error("Select all 4 players");
      return;
    }
    if (editScore1 === editScore2) {
      toast.error("Scores cannot be tied");
      return;
    }
    setEditSubmitting(true);
    try {
      const winning_team = editScore1 > editScore2 ? 1 : 2;
      const { error: updateErr } = await supabase
        .from("matches")
        .update({
          team1_score: editScore1,
          team2_score: editScore2,
          winning_team,
        })
        .eq("id", editMatch.match_id);
      if (updateErr) throw updateErr;

      const { error: delErr } = await supabase
        .from("match_players")
        .delete()
        .eq("match_id", editMatch.match_id);
      if (delErr) throw delErr;

      const mpRows = [
        { match_id: editMatch.match_id, player_id: editT1p1, team_number: 1 },
        { match_id: editMatch.match_id, player_id: editT1p2, team_number: 1 },
        { match_id: editMatch.match_id, player_id: editT2p1, team_number: 2 },
        { match_id: editMatch.match_id, player_id: editT2p2, team_number: 2 },
      ];
      const { error: insErr } = await supabase
        .from("match_players")
        .insert(mpRows);
      if (insErr) throw insErr;

      toast.success("Match updated!");
      setEditMatch(null);
      fetchMatches();
    } catch (e: any) {
      toast.error(e.message || "Failed to update match");
    } finally {
      setEditSubmitting(false);
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
                    <th className="px-2 py-2.5 w-10" />
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
                        <td className="px-2 py-2.5 text-center">
                          <button
                            onClick={() => openEditModal(m)}
                            className="p-1.5 rounded-md hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
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

      {/* Edit Match Modal */}
      <Dialog open={!!editMatch} onOpenChange={(open) => !open && setEditMatch(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Match</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Team 1
                </h3>
                <PlayerSelect
                  value={editT1p1}
                  onChange={setEditT1p1}
                  players={editAvailableFor(editT1p1)}
                  placeholder="Player 1"
                />
                <PlayerSelect
                  value={editT1p2}
                  onChange={setEditT1p2}
                  players={editAvailableFor(editT1p2)}
                  placeholder="Player 2"
                />
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Team 2
                </h3>
                <PlayerSelect
                  value={editT2p1}
                  onChange={setEditT2p1}
                  players={editAvailableFor(editT2p1)}
                  placeholder="Player 1"
                />
                <PlayerSelect
                  value={editT2p2}
                  onChange={setEditT2p2}
                  players={editAvailableFor(editT2p2)}
                  placeholder="Player 2"
                />
              </div>
            </div>

            <div className="flex items-center justify-center gap-6">
              <ScoreInput value={editScore1} onChange={(v) => setEditScore1(clampScore(v))} label="Team 1" />
              <span className="text-xl font-bold text-muted-foreground pt-5">–</span>
              <ScoreInput value={editScore2} onChange={(v) => setEditScore2(clampScore(v))} label="Team 2" />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setEditMatch(null)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleEditSave}
                disabled={editSubmitting || !editT1p1 || !editT1p2 || !editT2p1 || !editT2p2}
              >
                {editSubmitting ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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
  const [display, setDisplay] = useState(String(value));

  // Sync display when value changes externally
  useEffect(() => {
    setDisplay(String(value));
  }, [value]);

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
          value={display}
          onFocus={() => setDisplay("")}
          onBlur={() => {
            if (display === "") {
              setDisplay("0");
              onChange(0);
            }
          }}
          onChange={(e) => {
            const raw = e.target.value;
            setDisplay(raw);
            const n = parseInt(raw, 10);
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
