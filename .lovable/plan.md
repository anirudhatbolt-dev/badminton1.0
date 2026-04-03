

## Plan: Fix mobile sidebar transparency

### Problem
The mobile menu overlay on line 46 uses `bg-background/95` (95% opacity) with backdrop-blur, making underlying text bleed through.

### Fix
Change line 46's class from `bg-background/95 backdrop-blur` to `bg-background` (fully opaque).

### File changed
- `src/components/Navbar.tsx` — line 46: replace `bg-background/95 backdrop-blur` with `bg-background`

