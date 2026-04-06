

## Plan: Email Auth + Stats Page

### Overview
Add Supabase email/password authentication with login page, navbar integration, and match creation/edit guards. Add a `/stats` page showing top/bottom players and teams.

---

### Change 1: Auth Context (`src/contexts/AuthContext.tsx` — new)
- Create `AuthProvider` + `useAuth` hook
- Track `session` and `user` via `onAuthStateChange` (set up before `getSession()`)
- Provide `{ session, user, loading }` to the app

### Change 2: Root layout (`src/routes/__root.tsx`)
- Wrap app with `AuthProvider` (inside existing providers)
- Uncomment `<Toaster />` from sonner

### Change 3: Login page (`src/routes/login.tsx` — new)
- Single page with email + password fields
- Two buttons: "Sign In" and "Sign Up"
- Sign Up calls `supabase.auth.signUp({ email, password })`, shows confirmation message
- Sign In calls `supabase.auth.signInWithPassword({ email, password })`, redirects to `/matches`
- Error handling for wrong credentials, unconfirmed email
- Minimal styling matching app design

### Change 4: Navbar update (`src/components/Navbar.tsx`)
- Add "Stats" to `NAV_LINKS`: `{ label: "Stats", to: "/stats" }`
- Desktop: after nav links, show "Login" button (green, `bg-primary text-primary-foreground`) if not signed in; show email + "Sign Out" button if signed in
- Mobile sidebar: show Login/email+SignOut below nav items
- Use `useAuth()` hook for session state

### Change 5: Match guards (`src/routes/matches.tsx`)
- Import `useAuth` hook
- In `handleSubmit`: check session. If none, show toast "Sign in or create account to add matches" and return. If session exists, add `created_by: session.user.email` to the matches INSERT.
- In `handleEditSave`: same session check with toast guard

### Change 6: Stats page (`src/routes/stats.tsx` — new)
- Fetch `player_stats` where `matches_played > 0` and `team_stats` where `matches_played > 0`
- Compute 6 stats:
  - Best/Worst Player by AMP (highest/lowest `avg_match_points`)
  - Best/Worst Player by Win % (highest/lowest `win_pct`)
  - Best/Worst Team by AMP (highest/lowest `avg_match_points`)
- Render 6 non-clickable cards in 2-col grid (1-col mobile)
- Player cards: circular avatar + name + stat value
- Team cards: two avatars side by side + "Name & Name" + AMP value
- For team cards, fetch avatar_url from `players` table using `player1_id` and `player2_id`
- Include `<Navbar />` at top

### Files touched
| File | Action |
|------|--------|
| `src/contexts/AuthContext.tsx` | Create |
| `src/routes/__root.tsx` | Modify (add AuthProvider, uncomment Toaster) |
| `src/routes/login.tsx` | Create |
| `src/components/Navbar.tsx` | Modify (add Stats link, Login/SignOut) |
| `src/routes/matches.tsx` | Modify (add auth guards) |
| `src/routes/stats.tsx` | Create |

### No database migrations needed
The `created_by` column already exists on the `matches` table as a nullable text field.

