

## Plan: Rebuild homepage as Gigaminton badminton tracker

### Summary
Replace the inventory management landing page with a badminton stats app. New navbar with "Gigaminton" branding and four route links, hero section with custom image and copy, and a rankings section with three filterable tabs pulling data from Supabase.

### What changes

**1. New route files**
- Create `src/routes/players.tsx`, `src/routes/teams.tsx`, `src/routes/matches.tsx` as placeholder pages (simple heading + "Coming soon")

**2. Rewrite `src/routes/index.tsx`**
- Remove all inventory-related content (solutions, features, capabilities, browser frames, feature tabs, scroll reveal sections)
- **Navbar**: "Gigaminton" bold text top-left, center links (Rankings `/`, Players `/players`, Teams `/teams`, Matches `/matches`), mobile hamburger opening a sidebar with the same four links. No "Try Demo" button.
- **Hero**: Image from the Supabase storage URL (full size, no crop), title and description as specified, green CTA "Create Match" linking to `/matches`
- **Rankings section**: Three tabs (AMP, Win %, Wins with Mihir) using shadcn Tabs component
  - Tab 1 (AMP): Query `player_stats` sorted by `avg_match_points` DESC → columns: Player (avatar + name), Matches, AMP
  - Tab 2 (Win %): Query `player_stats` sorted by `win_pct` DESC → columns: Player, Matches Played, Matches Won, Win %
  - Tab 3 (Wins with Mihir): Query `partner_filtered_ranking` where `partner_name = 'Mihir'` sorted by `wins_together` DESC → columns: Player, Matches Played, Matches Won, Win %
  - Player column: 36px circular avatar from `avatar_url` (fetched by joining/looking up `players` table), fallback to a `User` icon
- Data fetched client-side via `supabase.from(...)` queries using React state/useEffect

**3. Update `src/routes/__root.tsx`**
- Change title meta from "Stackwise" to "Gigaminton"

**4. Files removed/cleaned**
- Remove unused imports (demo hooks, scroll reveal, inventory assets) from index.tsx
- The `/app` layout and its child routes remain untouched for now

### Technical details
- Uses existing `supabase` client from `@/integrations/supabase/client`
- Uses existing shadcn `Tabs`, `Table` components
- Player avatars: for `player_stats` view which already has `avatar_url`, use it directly; for `partner_filtered_ranking` which lacks `avatar_url`, join with `players` table client-side or do a separate lookup
- All RLS policies are public read, so no auth needed
- Mobile sidebar: simple sheet/drawer with nav links, triggered by hamburger icon

