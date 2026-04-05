

## Plan: Four fixes across Players, Matches, and App layout

### Fix 1 — Best/Worst partner and opponent logic (`src/routes/players.tsx`)
Replace lines 163-174 with the corrected reduce calls that use `win_pct_together` and `win_pct_vs` instead of raw win/loss counts.

### Fix 2 — Edit match feature (`src/routes/matches.tsx`)
- Add edit (pencil) icon button to each match history row
- Add edit modal with: 4 player dropdowns (pre-filled, no duplicates), score inputs (same style), Save/Cancel buttons
- Save: UPDATE matches scores + winning_team, DELETE + re-INSERT match_players
- After save, refresh match list
- Import `Pencil` from lucide-react, `Dialog/DialogContent/DialogHeader/DialogTitle` from ui

### Fix 3 — Remove demo guard from app layout (`src/routes/app.tsx`)
Already clean — the file currently has no demo guards, no `useDemo`, no `DemoBanner`. No changes needed.

### Fix 4 — Score input zero clearing (`src/routes/matches.tsx`)
- Change ScoreInput to use string state internally
- `onFocus`: clear to empty string
- `onBlur`: if empty, reset to 0
- Apply to both create and edit score inputs (same ScoreInput component)

### Files changed
- `src/routes/players.tsx` — lines 163-174: replace 4 reduce calls
- `src/routes/matches.tsx` — add edit modal, add onFocus/onBlur to ScoreInput, add pencil button to table rows

