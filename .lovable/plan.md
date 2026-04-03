

## Plan: Build Players and Teams Pages

### Summary
Replace the placeholder Players and Teams pages with full-featured pages that show player/team cards in a grid, with click-to-open modals displaying detailed stats fetched from Supabase views.

### What changes

**1. Rewrite `src/routes/players.tsx`**
- Reuse the Navbar component from index.tsx by extracting it to `src/components/Navbar.tsx` (shared across all routes)
- Fetch all rows from `players` table on mount
- Display a responsive grid of profile cards: 80px circular avatar + player name
- On card click, open a Dialog/Sheet modal that fetches:
  - `player_stats` (matches played/won/lost, win %, AMP)
  - `player_partner_stats` (best = max wins_together, worst = max losses_together) with partner avatar from `players`
  - `player_opponent_stats` (best = max wins_vs, worst = max losses_vs) with opponent avatar from `players`
  - `player_best_worst_matches` joined with `match_detail` for best/worst match scores and opponent names

**2. Rewrite `src/routes/teams.tsx`**
- Fetch all rows from `team_stats`
- Display grid of team cards: two 60px circular avatars side-by-side + both player names
- Avatars fetched by looking up player1_id/player2_id in `players` table
- On card click, open a Dialog modal that fetches:
  - Team stats from `team_stats` row (matches, win %, AMP, best/worst margin)
  - `team_opponent_stats` where team_player1_id/team_player2_id match (best = max wins_vs, worst = max losses_vs)

**3. Extract shared Navbar to `src/components/Navbar.tsx`**
- Move the Navbar and NAV_LINKS from index.tsx to a shared component
- Import in index.tsx, players.tsx, teams.tsx, matches.tsx

### Technical details
- Use shadcn `Dialog` for modals, existing `Table` for stat rows
- Reuse `PlayerAvatar` component (extract to shared component or inline)
- All views have public read RLS, no auth needed
- Partner/opponent avatars: since `player_partner_stats` and `player_opponent_stats` have player IDs but no avatar_url, do a secondary lookup against the `players` table (fetched once and cached in state)
- `player_best_worst_matches` has match_id but no opponent info — join with `match_detail` view to get team names and scores

