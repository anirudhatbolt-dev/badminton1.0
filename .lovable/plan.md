

## Plan: Add Vercel SPA rewrite config

Create `vercel.json` at the project root with the SPA rewrite rule so all routes fall back to `index.html`.

### File created
- `vercel.json` — single rewrite rule `"/(.*)"` → `"/index.html"`

