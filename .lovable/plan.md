

## Plan: Five UI fixes across Navbar, Home, Players, and Teams

### 1. Shrink hero banner image (`src/routes/index.tsx`)
- Change `max-w-md` on the hero `<img>` to `max-w-xs` (line 76)

### 2. Fix mobile sidebar z-index (`src/components/Navbar.tsx`)
- Change mobile overlay from `z-40` to `z-[100]` on line 46 so it renders above all page content

### 3. Rename "Rankings" to "Home" (`src/components/Navbar.tsx`)
- Change label on line 6 from `"Rankings"` to `"Home"`

### 4. Bigger player cards on mobile (`src/routes/players.tsx`)
- Change grid from `grid-cols-2 sm:grid-cols-3 md:grid-cols-4` to `grid-cols-2 sm:grid-cols-3 md:grid-cols-4` with larger padding/avatar — specifically increase card padding and avatar size, and keep 2 columns on mobile (already 2-col, so just increase card size with more padding and larger avatar)

### 5. Teams page: Rankings table + fix Best/Worst Game in modal (`src/routes/teams.tsx`)

**Rankings table (above team cards grid):**
- Add Tabs with two tabs: AMP and Win %
- AMP tab: table sorted by `avg_match_points DESC` with columns: Rank, Team (dual 36px avatars + "Name & Name"), Matches, AMP
- Win % tab: table sorted by `win_pct DESC` with columns: Rank, Team, Matches Played, Matches Won, Win %
- Data comes from already-fetched `team_stats`

**Fix Best/Worst Game in modal:**
- When modal opens, fetch all rows from `match_detail` where the two team players appear together on the same side (either team1 or team2, in any order)
- Filter logic: `((team1_player1_id, team1_player2_id) contains both player IDs) OR ((team2_player1_id, team2_player2_id) contains both player IDs)`
- Since Supabase JS doesn't support complex OR on pairs easily, fetch matches where at least one player ID appears, then filter client-side for both players on same team
- Calculate best game = max(their_score - opp_score), worst game = min(their_score - opp_score)
- Display format:
  ```
  Best Game
  21 – 14
  vs Sathish & Mihir
  ```
- If no matches, show "No matches played yet"

### Technical details

**Files changed:**
- `src/components/Navbar.tsx` — rename "Rankings" to "Home", change mobile overlay z-index to `z-[100]`
- `src/routes/index.tsx` — change hero image max-width from `max-w-md` to `max-w-xs`
- `src/routes/players.tsx` — increase card padding from `p-4` to `p-6`, keep `grid-cols-2` on mobile
- `src/routes/teams.tsx` — add Tabs+Table imports, add rankings section before cards grid, rewrite modal's Best/Worst Game section to fetch from `match_detail` and show scores with opponent names

