

## Plan: Build Matches Page with Create Form and Match History

### Summary
Replace the placeholder Matches page with two sections: a match creation form (player selection dropdowns with avatars, score inputs with +/- buttons) and a match history table fetched from `match_detail`.

### What changes

**1. Rewrite `src/routes/matches.tsx`**

**Section A — Create New Match**
- Fetch all players from `players` table on mount (id, name, avatar_url)
- Four `Select` dropdowns (Team 1 Player 1/2, Team 2 Player 1/2) showing circular avatar + name in each option
- Validation: prevent selecting the same player in multiple slots
- Two score inputs side-by-side, each with increment/decrement buttons and direct number editing (min 0, max 30)
- "Submit Match" button that:
  - Inserts into `matches`: status='completed', team1_score, team2_score, winning_team (higher score team), played_at=now()
  - Inserts 4 rows into `match_players`: one per player with match_id and team_number
  - Refreshes match history after success
  - Shows toast on success/error

**Section B — Match History**
- Fetch from `match_detail` ordered by `played_at DESC`
- Table columns: `#` (row number counting total down to 1, so newest = highest number), Team 1 (two 36px circular avatars + names like "Dev & Mayank"), Score (bold winning team's score), Team 2 (same format), Date (formatted as "Apr 3")
- Winning team column gets subtle highlight (slightly bolder text or accent color)
- Alternating row shading

**2. Update `src/components/PlayerAvatar.tsx`**
- Add fallback showing player's initial letter (grey circle) instead of generic User icon when avatar_url is null but name is provided

**3. No database changes needed**
- All tables (`matches`, `match_players`, `match_detail`, `players`) already exist with public RLS policies

### Technical details
- Use shadcn `Select` for player dropdowns with custom option rendering (avatar + name)
- Score inputs: controlled number inputs with `Button` for +/- arrows
- Date formatting: use `toLocaleDateString` with month short format
- Match number calculation: `totalMatches - index` where index is position in the DESC-sorted array
- Player avatar lookup: fetch players once, build a map of id → {name, avatar_url} for use in both form and history table
- `match_detail` view already provides all needed fields (player names, IDs, scores, played_at)

