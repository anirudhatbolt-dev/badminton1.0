
## Plan: Add Rank Tags to Player Cards

### What changes
**File: `src/routes/players.tsx`**

- Add a `playerStats` state (`PlayerStatRow[]`) and fetch all `player_stats` once on page load (alongside the existing players fetch)
- From the fetched stats (filtered to `matches_played > 0`), compute:
  - `topAmpId`: player_id with highest `avg_match_points`
  - `topWinPctId`: player_id with highest `win_pct`
- In the player card grid, after the player name `<span>`, conditionally render pill badges:
  - `#1 AMP` if player.id matches topAmpId
  - `#1 Win %` if player.id matches topWinPctId
- Badge style: `text-xs px-2 py-0.5 rounded-full border border-border bg-muted text-muted-foreground font-medium` — subtle pill annotation
- Badges shown in a flex row with `gap-1` below the name

### No other files touched
Only `src/routes/players.tsx` is modified. No DB changes needed — `player_stats` view already exists and is already typed.
