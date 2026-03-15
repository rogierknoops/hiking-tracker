# Hiking Trail Progress Tracker

An offline-first web app that tracks hiking progress against planned times. Add trail segments (distance, ascent, descent), set a custom duration formula, log departure and segment arrival times, and see time ahead/behind margins.

## Features

- **Segment management**: Add, edit, remove segments with distance (km), ascent (m), descent (m)
- **Configurable formula**: Use variables `d` (distance km), `a` (ascent m), `descent` (descent m). Formula evaluates to hours. Default: `(d/5) + (a/600)` (Naismith)
- **Departure time**: Set start time or use "Start now"
- **Arrival logging**: Log when you arrive at each segment; see per-segment and cumulative margin
- **Persistence**: Auto-saves to localStorage. Export/import JSON for backup.
- **PWA**: Installable, works offline without cell coverage

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Deploy

- **Netlify (recommended):** Connect your Git repo at [netlify.com](https://netlify.com); build and deploy are configured in `netlify.toml`. See [docs/DEPLOYMENT-Netlify.md](docs/DEPLOYMENT-Netlify.md).
- **TransIP:** Build, then upload the contents of `dist/` to the **www** folder via SFTP. See [docs/DEPLOYMENT-TransIP.md](docs/DEPLOYMENT-TransIP.md).  
  `npm run deploy` runs the build and reminds you to upload.
- **Vercel / Cloudflare Pages:** Same idea as Netlify: connect repo, build command `npm run build`, publish directory `dist`.
