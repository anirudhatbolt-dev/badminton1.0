

## Plan: Set uploaded image as favicon

### Steps
1. Copy `user-uploads://image.png` to `public/favicon.png`
2. Update `src/routes/__root.tsx` head links to add `{ rel: "icon", href: "/favicon.png" }`

### File changed
- `src/routes/__root.tsx` — add favicon link entry in the `links` array

