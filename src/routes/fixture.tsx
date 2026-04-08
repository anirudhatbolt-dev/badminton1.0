import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { CalendarIcon, Minus, Plus, Trophy, Droplets, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/fixture")({
  component: FixturePage,
});

type Player = { id: string; name: string; avatar_url: string | null };

type Phase =
  | "home"
  | "setup"
  | "select_starting_four"
  | "select_team1"
  | "playing"
  | "who_is_out"
  | "fixture_suggested"
  | "completed";

type MatchRecord = {
  team1: [string, string];
  team2: [string, string];
  team1Score: number;
  team2Score: number;
  winningTeam: 1 | 2;
  matchId: string;
};

type SessionEvent = {
  id?: string;
  event_type: string;
  sequence_number: number;
  match_id?: string | null;
  player_out_id?: string | null;
  player_in_id?: string | null;
  condition_applied?: string | null;
  condition_label?: string | null;
  team1_player1_id?: string | null;
  team1_player2_id?: string | null;
  team2_player1_id?: string | null;
  team2_player2_id?: string | null;
};

type PastSession = {
  id: string;
  played_at: string;
  status: string;
  matchCount: number;
};

type TeamPairing = { p1: string; p2: string };

function FixturePage() {
  const { session: authSession } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [phase, setPhase] = useState<Phase>("home");
  const [pastSessions, setPastSessions] = useState<PastSession[]>([]);

  // Session state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionDate, setSessionDate] = useState<Date>(new Date());
  const [selectedFour, setSelectedFour] = useState<string[]>([]);
  const [sittingOut, setSittingOut] = useState<string>("");
  const [team1, setTeam1] = useState<[string, string]>(["", ""]);
  const [team2, setTeam2] = useState<[string, string]>(["", ""]);
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Rotation state
  const [consecutiveLosses, setConsecutiveLosses] = useState<Record<string, number>>({});
  const [newEntryProtection, setNewEntryProtection] = useState<Record<string, boolean>>({});
  const [exitQueue, setExitQueue] = useState<string[]>([]);
  const [matchHistory, setMatchHistory] = useState<MatchRecord[]>([]);
  const [teamPairHistory, setTeamPairHistory] = useState<TeamPairing[]>([]);
  const [sessionEvents, setSessionEvents] = useState<SessionEvent[]>([]);
  const [seqNum, setSeqNum] = useState(1);

  // Condition results
  const [conditionBanner, setConditionBanner] = useState<string>("");
  const [losingTeam, setLosingTeam] = useState<[string, string]>(["", ""]);
  const [suggestedFixture, setSuggestedFixture] = useState<{ team1: [string, string]; team2: [string, string]; label: string } | null>(null);
  const [allPairings, setAllPairings] = useState<{ team1: [string, string]; team2: [string, string] }[]>([]);

  // End session dialog
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  // Summary view
  const [summaryEvents, setSummaryEvents] = useState<SessionEvent[]>([]);

  const fetchPlayers = useCallback(async () => {
    const { data } = await supabase.from("players").select("id, name, avatar_url").order("name");
    if (data) setPlayers(data);
  }, []);

  const fetchPastSessions = useCallback(async () => {
    const { data: sessions } = await supabase
      .from("sessions")
      .select("id, played_at, status")
      .order("played_at", { ascending: false });
    if (sessions) {
      const withCounts = await Promise.all(
        sessions.map(async (s) => {
          const { count } = await supabase
            .from("session_events")
            .select("id", { count: "exact", head: true })
            .eq("session_id", s.id)
            .eq("event_type", "match_played");
          return { id: s.id, played_at: s.played_at, status: s.status, matchCount: count ?? 0 };
        })
      );
      setPastSessions(withCounts);
    }
  }, []);

  useEffect(() => {
    fetchPlayers();
    fetchPastSessions();
  }, [fetchPlayers, fetchPastSessions]);

  const playerMap = Object.fromEntries(players.map((p) => [p.id, p]));
  const pName = (id: string) => playerMap[id]?.name ?? "?";
  const pAvatar = (id: string) => playerMap[id]?.avatar_url ?? null;

  const clampScore = (v: number) => Math.max(0, Math.min(30, v));

  const addEvent = async (evt: Omit<SessionEvent, "sequence_number">) => {
    if (!sessionId) return;
    const sn = seqNum;
    setSeqNum((p) => p + 1);
    const fullEvt: SessionEvent = { ...evt, sequence_number: sn };
    setSessionEvents((prev) => [...prev, fullEvt]);
    await supabase.from("session_events").insert({ ...fullEvt, session_id: sessionId });
    return fullEvt;
  };

  // ─── PHASE: HOME ───
  const handleCreateSession = async () => {
    if (!authSession) {
      toast.error("Sign in to create a session");
      return;
    }
    setPhase("setup");
  };

  const handleStartSession = async () => {
    const { data, error } = await supabase
      .from("sessions")
      .insert({
        played_at: format(sessionDate, "yyyy-MM-dd"),
        created_by: authSession?.user.email ?? null,
        status: "active",
      })
      .select("id")
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }
    setSessionId(data.id);
    setPhase("select_starting_four");
  };

  const toggleSelectFour = (id: string) => {
    setSelectedFour((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  };

  const confirmStartingFour = () => {
    if (selectedFour.length !== 4) {
      toast.error("Select exactly 4 players");
      return;
    }
    const sitting = players.find((p) => !selectedFour.includes(p.id));
    if (sitting) setSittingOut(sitting.id);
    setPhase("select_team1");
  };

  const [team1Selection, setTeam1Selection] = useState<string[]>([]);

  const toggleTeam1 = (id: string) => {
    setTeam1Selection((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      if (prev.length >= 2) return prev;
      return [...prev, id];
    });
  };

  const confirmTeams = () => {
    if (team1Selection.length !== 2) {
      toast.error("Select 2 players for Team 1");
      return;
    }
    const t2 = selectedFour.filter((p) => !team1Selection.includes(p));
    setTeam1([team1Selection[0], team1Selection[1]]);
    setTeam2([t2[0], t2[1]]);
    setTeamPairHistory((prev) => [
      ...prev,
      { p1: team1Selection[0], p2: team1Selection[1] },
      { p1: t2[0], p2: t2[1] },
    ]);
    setScore1(0);
    setScore2(0);
    setPhase("playing");
  };

  const handleSubmitScore = async () => {
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
          session_id: sessionId,
          created_by: authSession?.user.email ?? null,
        })
        .select("id")
        .single();
      if (error) throw error;

      const mpRows = [
        { match_id: match.id, player_id: team1[0], team_number: 1 },
        { match_id: match.id, player_id: team1[1], team_number: 1 },
        { match_id: match.id, player_id: team2[0], team_number: 2 },
        { match_id: match.id, player_id: team2[1], team_number: 2 },
      ];
      await supabase.from("match_players").insert(mpRows);

      await addEvent({
        event_type: "match_played",
        match_id: match.id,
        team1_player1_id: team1[0],
        team1_player2_id: team1[1],
        team2_player1_id: team2[0],
        team2_player2_id: team2[1],
      });

      const record: MatchRecord = {
        team1: [...team1],
        team2: [...team2],
        team1Score: score1,
        team2Score: score2,
        winningTeam: winning_team as 1 | 2,
        matchId: match.id,
      };
      const newHistory = [...matchHistory, record];
      setMatchHistory(newHistory);

      const losers = winning_team === 1 ? [...team2] : [...team1];
      const winners = winning_team === 1 ? [...team1] : [...team2];
      setLosingTeam(losers as [string, string]);

      // Update consecutive losses
      const newConsec = { ...consecutiveLosses };
      losers.forEach((id) => (newConsec[id] = (newConsec[id] ?? 0) + 1));
      winners.forEach((id) => (newConsec[id] = 0));

      // First match → manual selection
      if (newHistory.length === 1) {
        setConsecutiveLosses(newConsec);
        setPhase("who_is_out");
        return;
      }

      // CONDITION 2: Back-to-back losses
      const backToBack = losers.filter((id) => (consecutiveLosses[id] ?? 0) >= 1);
      if (backToBack.length > 0) {
        const ejected = backToBack.length === 1
          ? backToBack[0]
          : backToBack.sort((a, b) => (consecutiveLosses[b] ?? 0) - (consecutiveLosses[a] ?? 0))[0];
        setConsecutiveLosses(newConsec);
        handleAutoEject(ejected, losers, "back_to_back_losses", `${pName(ejected)} is out — Exiting due to back-to-back losses`);
        return;
      }

      // CONDITION 3: New entry insurance
      const protectedPlayers = losers.filter((id) => newEntryProtection[id]);
      if (protectedPlayers.length === 1) {
        const safePid = protectedPlayers[0];
        const otherPid = losers.find((id) => id !== safePid)!;
        setConsecutiveLosses(newConsec);
        handleAutoEject(otherPid, losers, "new_entry_insurance", `${pName(safePid)} is safe — New Entry Insurance applies. ${pName(otherPid)} is out.`);
        return;
      }

      // No condition → manual
      setConsecutiveLosses(newConsec);
      setPhase("who_is_out");
    } catch (e: any) {
      toast.error(e.message || "Failed to submit score");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAutoEject = (ejectedId: string, losers: string[], condition: string, label: string) => {
    setConditionBanner(label);
    processSubstitution(ejectedId, condition, label);
  };

  const handleManualEject = (ejectedId: string) => {
    processSubstitution(ejectedId, null, null);
  };

  const processSubstitution = async (ejectedId: string, condition: string | null, label: string | null) => {
    const incomingId = sittingOut;

    // Record events
    await addEvent({
      event_type: "player_out",
      player_out_id: ejectedId,
      player_in_id: incomingId,
      condition_applied: condition,
      condition_label: label,
    });

    // Update state
    setExitQueue((prev) => [...prev, ejectedId]);
    setNewEntryProtection((prev) => ({ ...prev, [incomingId]: true, [ejectedId]: false }));
    setSittingOut(ejectedId);

    // Build next 4 players
    const currentFour = [team1[0], team1[1], team2[0], team2[1]];
    const remaining = currentFour.filter((id) => id !== ejectedId);
    const nextFour = [...remaining, incomingId];

    // Generate fixture suggestion
    generateFixtureSuggestion(nextFour);
  };

  const generateFixtureSuggestion = (fourPlayers: string[]) => {
    // Generate all 3 possible team pairings
    const pairings: { team1: [string, string]; team2: [string, string] }[] = [];
    for (let i = 0; i < fourPlayers.length; i++) {
      for (let j = i + 1; j < fourPlayers.length; j++) {
        const t1: [string, string] = [fourPlayers[i], fourPlayers[j]];
        const t2: [string, string] = fourPlayers.filter((p) => p !== fourPlayers[i] && p !== fourPlayers[j]) as [string, string];
        pairings.push({ team1: t1, team2: t2 });
      }
    }
    setAllPairings(pairings);

    const pairKey = (a: string, b: string) => [a, b].sort().join("|");
    const historyKeys = new Set(teamPairHistory.map((p) => pairKey(p.p1, p.p2)));

    // CONDITION 1: New team over repeated
    const newPairings = pairings.filter((p) => {
      const k1 = pairKey(p.team1[0], p.team1[1]);
      const k2 = pairKey(p.team2[0], p.team2[1]);
      return !historyKeys.has(k1) || !historyKeys.has(k2);
    });

    let chosen: { team1: [string, string]; team2: [string, string] };
    let condLabel = "";

    if (newPairings.length === 1) {
      chosen = newPairings[0];
      condLabel = "New team over repeated team rule applied";
    } else if (newPairings.length > 1) {
      // Pick pairing with most new combinations
      const scored = newPairings.map((p) => {
        const k1 = pairKey(p.team1[0], p.team1[1]);
        const k2 = pairKey(p.team2[0], p.team2[1]);
        const newCount = (historyKeys.has(k1) ? 0 : 1) + (historyKeys.has(k2) ? 0 : 1);
        return { ...p, newCount };
      });
      scored.sort((a, b) => b.newCount - a.newCount);
      chosen = scored[0];
      condLabel = "New team over repeated team rule applied";
    } else {
      // All repeats — pick least recently played
      const lastIndex = (p: { team1: [string, string]; team2: [string, string] }) => {
        const k1 = pairKey(p.team1[0], p.team1[1]);
        const k2 = pairKey(p.team2[0], p.team2[1]);
        let maxIdx = -1;
        teamPairHistory.forEach((h, idx) => {
          const hk = pairKey(h.p1, h.p2);
          if (hk === k1 || hk === k2) maxIdx = Math.max(maxIdx, idx);
        });
        return maxIdx;
      };
      const sorted = [...pairings].sort((a, b) => lastIndex(a) - lastIndex(b));
      chosen = sorted[0];
      condLabel = "All combinations played — picking least recent";
    }

    setSuggestedFixture({ ...chosen, label: condLabel });
    setPhase("fixture_suggested");
  };

  const playFixture = async (t1: [string, string], t2: [string, string], isOverride: boolean) => {
    await addEvent({
      event_type: isOverride ? "fixture_override" : "fixture_suggested",
      team1_player1_id: t1[0],
      team1_player2_id: t1[1],
      team2_player1_id: t2[0],
      team2_player2_id: t2[1],
    });

    setTeam1(t1);
    setTeam2(t2);
    setTeamPairHistory((prev) => [
      ...prev,
      { p1: t1[0], p2: t1[1] },
      { p1: t2[0], p2: t2[1] },
    ]);
    setScore1(0);
    setScore2(0);
    setConditionBanner("");
    setPhase("playing");
  };

  const handleEndSession = async () => {
    if (!sessionId) return;
    await supabase.from("sessions").update({ status: "completed" }).eq("id", sessionId);
    await addEvent({ event_type: "session_ended" });

    // Fetch all events for summary
    const { data } = await supabase
      .from("session_events")
      .select("*")
      .eq("session_id", sessionId)
      .order("sequence_number");
    setSummaryEvents(data ?? []);
    setShowEndConfirm(false);
    setPhase("completed");
  };

  const resetSession = () => {
    setSessionId(null);
    setPhase("home");
    setSelectedFour([]);
    setSittingOut("");
    setTeam1(["", ""]);
    setTeam2(["", ""]);
    setScore1(0);
    setScore2(0);
    setConsecutiveLosses({});
    setNewEntryProtection({});
    setExitQueue([]);
    setMatchHistory([]);
    setTeamPairHistory([]);
    setSessionEvents([]);
    setSeqNum(1);
    setConditionBanner("");
    setSuggestedFixture(null);
    setTeam1Selection([]);
    setSummaryEvents([]);
    fetchPastSessions();
  };

  // ─── Waterboy computation ───
  const computeWaterboy = (events: SessionEvent[]) => {
    const exitCounts: Record<string, number> = {};
    events.forEach((e) => {
      if (e.event_type === "player_out" && e.player_out_id) {
        exitCounts[e.player_out_id] = (exitCounts[e.player_out_id] ?? 0) + 1;
      }
    });
    let maxId = "";
    let maxCount = 0;
    Object.entries(exitCounts).forEach(([id, count]) => {
      if (count > maxCount) {
        maxId = id;
        maxCount = count;
      }
    });
    return maxId ? { id: maxId, count: maxCount } : null;
  };

  // ─── RENDER ───
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-8">
        {phase === "home" && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">Fixture</h1>
              <Button onClick={handleCreateSession}>Create Session</Button>
            </div>
            <p className="text-xs text-muted-foreground mb-4">Works best with 5 players</p>
            {pastSessions.length === 0 ? (
              <p className="text-muted-foreground">No sessions yet.</p>
            ) : (
              <div className="space-y-2">
                {pastSessions.map((s) => (
                  <div key={s.id} className="rounded-xl border bg-card p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{format(new Date(s.played_at), "MMMM d, yyyy")}</p>
                      <p className="text-sm text-muted-foreground">{s.matchCount} matches · {s.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {phase === "setup" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">New Session</h2>
            <div className="space-y-2">
              <p className="text-sm font-medium">Date</p>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-[240px] justify-start text-left font-normal")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(sessionDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={sessionDate}
                    onSelect={(d) => d && setSessionDate(d)}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setPhase("home")}>Cancel</Button>
              <Button onClick={handleStartSession}>Start Session</Button>
            </div>
          </div>
        )}

        {phase === "select_starting_four" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Select Starting 4</h2>
            <p className="text-sm text-muted-foreground">Pick 4 players. The remaining player sits out first.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {players.map((p) => (
                <PlayerSelectCard
                  key={p.id}
                  player={p}
                  selected={selectedFour.includes(p.id)}
                  onClick={() => toggleSelectFour(p.id)}
                />
              ))}
            </div>
            <Button onClick={confirmStartingFour} disabled={selectedFour.length !== 4}>
              Next ({selectedFour.length}/4)
            </Button>
          </div>
        )}

        {phase === "select_team1" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Select Team 1</h2>
            <p className="text-sm text-muted-foreground">Pick 2 for Team 1. Remaining 2 become Team 2.</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {selectedFour.map((id) => (
                <PlayerSelectCard
                  key={id}
                  player={playerMap[id]}
                  selected={team1Selection.includes(id)}
                  onClick={() => toggleTeam1(id)}
                />
              ))}
            </div>
            {team1Selection.length === 2 && (
              <div className="rounded-xl border bg-card p-4 text-center space-y-1">
                <p className="text-sm font-semibold">
                  Team 1: {pName(team1Selection[0])} & {pName(team1Selection[1])}
                </p>
                <p className="text-xs text-muted-foreground">vs</p>
                <p className="text-sm font-semibold">
                  Team 2: {selectedFour.filter((id) => !team1Selection.includes(id)).map(pName).join(" & ")}
                </p>
              </div>
            )}
            <div className="text-sm text-muted-foreground">
              Sitting out: <span className="font-medium text-foreground">{pName(sittingOut)}</span>
            </div>
            <Button onClick={confirmTeams} disabled={team1Selection.length !== 2}>
              Next
            </Button>
          </div>
        )}

        {phase === "playing" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Match {matchHistory.length + 1}</h2>
              <Button variant="outline" size="sm" onClick={() => setShowEndConfirm(true)}>
                End Session
              </Button>
            </div>

            {conditionBanner && (
              <div className="rounded-lg border border-accent bg-accent/10 p-3 text-sm font-medium flex items-center gap-2">
                <Zap className="h-4 w-4 text-accent-foreground" />
                {conditionBanner}
              </div>
            )}

            <div className="rounded-xl border bg-card p-6">
              <div className="flex flex-col items-center gap-4">
                <TeamDisplay label="Team 1" p1={team1[0]} p2={team1[1]} playerMap={playerMap} />
                <span className="text-lg font-bold text-muted-foreground">VS</span>
                <TeamDisplay label="Team 2" p1={team2[0]} p2={team2[1]} playerMap={playerMap} />
              </div>

              <div className="flex items-center justify-center gap-6 mt-6">
                <ScoreInput value={score1} onChange={(v) => setScore1(clampScore(v))} label="Team 1" />
                <span className="text-xl font-bold text-muted-foreground pt-5">–</span>
                <ScoreInput value={score2} onChange={(v) => setScore2(clampScore(v))} label="Team 2" />
              </div>

              <Button
                onClick={handleSubmitScore}
                disabled={submitting}
                className="w-full mt-6"
                size="lg"
              >
                {submitting ? "Submitting…" : "Submit Score"}
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">
              Sitting out: <span className="font-medium text-foreground">{pName(sittingOut)}</span>
            </div>
          </div>
        )}

        {phase === "who_is_out" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Who sits out?</h2>
            <p className="text-sm text-muted-foreground">Select one player from the losing team to sit out.</p>
            <div className="grid grid-cols-2 gap-3 max-w-sm">
              {losingTeam.map((id) => (
                <PlayerSelectCard
                  key={id}
                  player={playerMap[id]}
                  selected={false}
                  onClick={() => handleManualEject(id)}
                />
              ))}
            </div>
          </div>
        )}

        {phase === "fixture_suggested" && suggestedFixture && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Suggested Fixture</h2>

            {conditionBanner && (
              <div className="rounded-lg border border-accent bg-accent/10 p-3 text-sm font-medium flex items-center gap-2">
                <Zap className="h-4 w-4 text-accent-foreground" />
                {conditionBanner}
              </div>
            )}

            <div className="rounded-xl border bg-card p-6 text-center space-y-3">
              <div className="flex items-center justify-center gap-3">
                <TeamDisplay label="Team 1" p1={suggestedFixture.team1[0]} p2={suggestedFixture.team1[1]} playerMap={playerMap} />
              </div>
              <p className="text-lg font-bold text-muted-foreground">VS</p>
              <div className="flex items-center justify-center gap-3">
                <TeamDisplay label="Team 2" p1={suggestedFixture.team2[0]} p2={suggestedFixture.team2[1]} playerMap={playerMap} />
              </div>
              {suggestedFixture.label && (
                <p className="text-xs text-muted-foreground italic">{suggestedFixture.label}</p>
              )}
            </div>

            <div className="flex gap-3">
              <Button onClick={() => playFixture(suggestedFixture.team1, suggestedFixture.team2, false)}>
                Play This
              </Button>
              <ManualFixtureSelector
                pairings={allPairings}
                playerMap={playerMap}
                onSelect={(t1, t2) => playFixture(t1, t2, true)}
              />
            </div>

            <div className="text-sm text-muted-foreground">
              Sitting out: <span className="font-medium text-foreground">{pName(sittingOut)}</span>
            </div>
          </div>
        )}

        {phase === "completed" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Session Summary</h2>
            <SessionTimeline events={summaryEvents} playerMap={playerMap} matchHistory={matchHistory} />
            <WaterboyCard waterboy={computeWaterboy(summaryEvents)} playerMap={playerMap} />
            <Button onClick={resetSession}>Done</Button>
          </div>
        )}
      </div>

      {/* End Session Confirm */}
      <Dialog open={showEndConfirm} onOpenChange={setShowEndConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End session?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This will finalize the session. You can't add more matches after this.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEndConfirm(false)}>Cancel</Button>
            <Button onClick={handleEndSession}>End Session</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Sub-components ───

function PlayerSelectCard({ player, selected, onClick }: { player: Player; selected: boolean; onClick: () => void }) {
  if (!player) return null;
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-xl border p-4 flex flex-col items-center gap-2 transition-all",
        selected ? "border-primary bg-primary/10 ring-2 ring-primary" : "bg-card hover:bg-accent/50"
      )}
    >
      <PlayerAvatar url={player.avatar_url} name={player.name} size={48} />
      <span className="text-sm font-medium">{player.name}</span>
    </button>
  );
}

function TeamDisplay({ label, p1, p2, playerMap }: { label: string; p1: string; p2: string; playerMap: Record<string, Player> }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <PlayerAvatar url={playerMap[p1]?.avatar_url ?? null} name={playerMap[p1]?.name ?? "?"} size={36} />
          <span className="font-medium">{playerMap[p1]?.name ?? "?"}</span>
        </div>
        <span className="text-muted-foreground">&</span>
        <div className="flex items-center gap-2">
          <PlayerAvatar url={playerMap[p2]?.avatar_url ?? null} name={playerMap[p2]?.name ?? "?"} size={36} />
          <span className="font-medium">{playerMap[p2]?.name ?? "?"}</span>
        </div>
      </div>
    </div>
  );
}

function ScoreInput({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  const [display, setDisplay] = useState(String(value));
  useEffect(() => { setDisplay(String(value)); }, [value]);
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onChange(value - 1)} disabled={value <= 0}>
          <Minus className="h-3 w-3" />
        </Button>
        <input
          type="number"
          min={0}
          max={30}
          value={display}
          onFocus={() => setDisplay("")}
          onBlur={() => { if (display === "") { setDisplay("0"); onChange(0); } }}
          onChange={(e) => {
            const raw = e.target.value;
            setDisplay(raw);
            const n = parseInt(raw, 10);
            if (!isNaN(n)) onChange(Math.max(0, Math.min(30, n)));
          }}
          className="w-12 h-8 text-center text-lg font-bold border rounded-lg bg-background [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onChange(value + 1)} disabled={value >= 30}>
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

function ManualFixtureSelector({
  pairings,
  playerMap,
  onSelect,
}: {
  pairings: { team1: [string, string]; team2: [string, string] }[];
  playerMap: Record<string, Player>;
  onSelect: (t1: [string, string], t2: [string, string]) => void;
}) {
  const [open, setOpen] = useState(false);
  const pName = (id: string) => playerMap[id]?.name ?? "?";
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>Choose Manually</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choose Fixture</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {pairings.map((p, i) => (
              <button
                key={i}
                onClick={() => { onSelect(p.team1, p.team2); setOpen(false); }}
                className="w-full rounded-xl border bg-card p-3 text-sm hover:bg-accent/50 transition-colors text-left"
              >
                {pName(p.team1[0])} & {pName(p.team1[1])} <span className="text-muted-foreground">vs</span> {pName(p.team2[0])} & {pName(p.team2[1])}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SessionTimeline({ events, playerMap, matchHistory }: { events: SessionEvent[]; playerMap: Record<string, Player>; matchHistory: MatchRecord[] }) {
  const pName = (id: string | null | undefined) => (id ? playerMap[id]?.name ?? "?" : "?");
  let matchIdx = 0;

  return (
    <div className="space-y-3">
      {events.map((e, i) => {
        if (e.event_type === "match_played") {
          matchIdx++;
          const mRecord = matchHistory.find((m) => m.matchId === e.match_id);
          return (
            <div key={i} className="rounded-xl border bg-card p-4 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Match {matchIdx}</p>
              <p className="text-sm">
                <span className="font-medium">{pName(e.team1_player1_id)} & {pName(e.team1_player2_id)}</span>
                {mRecord && (
                  <span className="font-bold mx-2">{mRecord.team1Score} – {mRecord.team2Score}</span>
                )}
                <span className="font-medium">{pName(e.team2_player1_id)} & {pName(e.team2_player2_id)}</span>
              </p>
              {mRecord && (
                <p className="text-xs text-muted-foreground">Team {mRecord.winningTeam} won</p>
              )}
            </div>
          );
        }
        if (e.event_type === "player_out") {
          return (
            <div key={i} className="rounded-lg border-l-4 border-primary bg-muted/50 p-3 space-y-0.5">
              <p className="text-sm">
                {pName(e.player_out_id)} exited → {pName(e.player_in_id)} entered
              </p>
              {e.condition_label && (
                <p className="text-xs text-muted-foreground">Reason: {e.condition_label}</p>
              )}
            </div>
          );
        }
        if (e.event_type === "fixture_override") {
          return (
            <div key={i} className="rounded-lg bg-muted/30 p-3 text-sm flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-muted-foreground" />
              Manual override — teams chosen manually
            </div>
          );
        }
        if (e.event_type === "session_ended") {
          return (
            <div key={i} className="rounded-lg bg-muted/30 p-3 text-sm text-muted-foreground text-center">
              Session ended
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}

function WaterboyCard({ waterboy, playerMap }: { waterboy: { id: string; count: number } | null; playerMap: Record<string, Player> }) {
  if (!waterboy) return null;
  const p = playerMap[waterboy.id];
  return (
    <div className="rounded-xl border bg-card p-5 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
        <Droplets className="h-3.5 w-3.5" /> Waterboy of the Day
      </p>
      <div className="flex items-center gap-3">
        <PlayerAvatar url={p?.avatar_url ?? null} name={p?.name ?? "?"} size={48} />
        <div>
          <p className="text-lg font-bold">{p?.name ?? "?"}</p>
          <p className="text-sm text-muted-foreground">Exited {waterboy.count} time{waterboy.count > 1 ? "s" : ""}</p>
        </div>
      </div>
    </div>
  );
}
