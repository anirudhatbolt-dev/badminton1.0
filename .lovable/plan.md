

## Plan: Best/Worst Match Cards + Auth Fix + Avatar Dropdown + Rename

### Task 1: Best Match / Worst Match stat cards

**File: `src/routes/stats.tsx`**

- Add a `MatchDetail` type with fields from `match_detail` view (match_id, team1_score, team2_score, team1_player1_name, team1_player2_name, team2_player1_name, team2_player2_name, status)
- In `useEffect`, fetch from `match_detail` where `status = 'completed'`, select relevant columns
- Compute best match (highest `team1_score + team2_score`) and worst match (lowest sum)
- Add a `MatchCard` component matching existing card style: label at top, score line "21 – 19", team names below "Name & Name vs Name & Name"
- Render two new cards at the bottom of the grid. If no completed matches, show "No matches yet" inside the card.

### Task 2: Auth redirect URL fix

**File: `src/routes/login.tsx`**

- In `handleSignUp`, add `options: { emailRedirectTo: window.location.origin }` to the `signUp` call

### Task 3: Avatar dropdown replacing Login button

**File: `src/components/Navbar.tsx`**

- Import `User` icon from lucide-react and `DropdownMenu` components from `@/components/ui/dropdown-menu`
- When signed in (desktop): replace email text + Sign Out button with a circular avatar trigger (User icon in a rounded-full button) that opens a dropdown with one item: "Sign Out" (calls `signOut()` then navigates to `/`)
- When signed in (mobile): same pattern — avatar icon + Sign Out dropdown item instead of raw text

### Task 4: Rename Gigaminton to Chadminton

**File: `src/components/Navbar.tsx`**

- Change the logo text from "Gigaminton" to "Chadminton" (only occurrence found in codebase — root already says Chadminton)

### Files touched

| File | Action |
|------|--------|
| `src/routes/stats.tsx` | Add match_detail fetch + MatchCard + 2 new cards |
| `src/routes/login.tsx` | Add emailRedirectTo option |
| `src/components/Navbar.tsx` | Avatar dropdown, rename to Chadminton |

