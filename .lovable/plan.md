

## Plan: Stats Win% Cards + Report Card Page + Fixture Session Page

### Overview
Three changes: (1) add team win% cards to /stats, (2) new /report page with per-date performance modals, (3) new /fixture page with full session management and rotation logic.

---

### Change 1: Team Win% Cards on /stats

**File: `src/routes/stats.tsx`**

- `TeamStat` type already has `win_pct` from the view — just use it
- Compute `bestTeamWin` and `worstTeamWin` from `teamStats` sorted by `win_pct`
- Add a `TeamWinCard` variant of `TeamCard` that shows matches_played / wins / win% below the names (need to add `matches_won` and `win_pct` to the `TeamStat` type since the view has those columns)
- Render 2 new cards after the existing team AMP cards, before the match cards

---

### Change 2: Report Card Page (`src/routes/report.tsx` — new)

**File: `src/routes/report.tsx`**

- Fetch distinct dates from `matches` where `status = 'completed'`, formatted as "April 7" etc.
- Display as horizontal scrollable row of pill buttons
- Clicking a date opens a Dialog modal
- Inside modal: fetch all `match_detail` rows for that date, then compute inline:
  - Per-player stats: for each player appearing in those matches, count matches played, wins, total points → derive AMP and win%
  - Per-team stats: for each team pair, count matches, wins → derive win%
  - Best/Worst Player AMP, Best/Worst Player Win%, Best/Worst Team Win%
- Display 6 small cards inside the modal matching /stats card style
- Players with 0 matches excluded; show "Not enough data" if fewer than 2 players

**File: `src/components/Navbar.tsx`**

- Add `{ label: "Report", to: "/report" }` to `NAV_LINKS`

---

### Change 3: Fixture Session Page (`src/routes/fixture.tsx` — new)

**File: `src/routes/fixture.tsx`** (~600-800 lines)

This is a complex stateful page managing a live badminton rotation session. All game state lives in React state, with writes to Supabase for persistence.

**Phase flow:**
1. **Home** — List past sessions (from `sessions` table) + "Create Session" button
2. **Setup** — Date picker, auth guard, creates row in `sessions`
3. **Select Starting 4** — Show all 5 players as selectable cards, pick 4
4. **Select Team 1** — From the 4, pick 2 for Team 1, remaining 2 auto-assigned to Team 2
5. **Playing** — Show fixture, score inputs (reuse ScoreInput pattern from matches), "Submit Score" + "End Session"
6. **Who Is Out** — Manual selection of which losing player exits (only when no condition auto-decides)
7. **Fixture Suggested** — Show AI-suggested next fixture with condition label, "Play This" or "Choose Manually"
8. **Session Summary** — Timeline of all events + Waterboy of the Day

**Condition logic (priority order after first match):**
- Condition 2: Back-to-back losses — auto-eject player with 2+ consecutive losses
- Condition 3: New entry insurance — protect newly entered player, eject the other loser
- Condition 1: New team over repeated team — prefer team pairings not yet seen

**Supabase writes:**
- `sessions` INSERT on create, UPDATE on end
- `matches` INSERT with `session_id` on score submit
- `match_players` INSERT (4 rows per match)
- `session_events` INSERT for each event (match_played, player_out, player_in, fixture_suggested, fixture_override, session_ended)

**Sub-components (all inline in the file):**
- `PlayerSelectCard` — clickable player card with avatar
- `ScoreInput` — reuse pattern from matches.tsx
- `FixtureBanner` — condition explanation banner
- `SessionTimeline` — vertical timeline from session_events
- `WaterboyCard` — player with most exits

**File: `src/components/Navbar.tsx`**

- Add `{ label: "Fixture", to: "/fixture" }` to `NAV_LINKS`

---

### Files touched

| File | Action |
|------|--------|
| `src/routes/stats.tsx` | Add team win% cards (update type, compute, render) |
| `src/routes/report.tsx` | Create — date pills + modal with 6 stat cards |
| `src/routes/fixture.tsx` | Create — full session management page |
| `src/components/Navbar.tsx` | Add "Report" and "Fixture" links |

### No database migrations needed
Tables `sessions`, `session_events` already exist. `matches.session_id` column already exists.

