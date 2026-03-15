# Deploying Hiking Tracker to Netlify

Netlify is a simple way to host this static app: connect your repo, and it builds and deploys on every push. Free tier is usually enough for a small app.

## Option 1: Deploy via Git (recommended)

1. **Push your code** to GitHub, GitLab, or Bitbucket (if you haven’t already).

2. **Log in to [Netlify](https://app.netlify.com)** and click **Add new site** → **Import an existing project**.

3. **Connect your repo** and pick the Hiking Tracker repository.

4. **Build settings** (often auto-detected from `netlify.toml`):
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Base directory:** leave empty unless the app lives in a subfolder of the repo.

5. Click **Deploy**. Netlify runs `npm run build` and serves the `dist/` output. You get a URL like `random-name-123.netlify.app`.

6. **Custom domain (optional):** Site settings → Domain management → Add custom domain and follow the DNS instructions.

## Install as a PWA (after deploy)

Once the site is live on Netlify (or any HTTPS URL), visitors can install it as an app. The app already has a manifest and service worker; installation is done in the **browser**, not in Netlify.

**Chrome / Edge (desktop)**  
- Open your site (e.g. `https://yoursite.netlify.app`).  
- Look for an **install** icon in the address bar (⊕ or “Install app”) and click it, **or** use the menu: **⋮** → **Install Hiking Trail Progress Tracker** (or **Apps** → **Install app**).  
- Confirm; the app opens in its own window and can be pinned to the taskbar/dock.

**Android (Chrome)**  
- Open the site in Chrome.  
- **Menu (⋮)** → **Install app** or **Add to Home screen**.  
- The icon appears on the home screen and opens in standalone (full-screen) mode.

**iOS (Safari)**  
- Open the site in **Safari** (install prompt is not shown in Chrome on iOS).  
- Tap the **Share** button (square with arrow).  
- Tap **Add to Home Screen** → name it → **Add**.  
- The icon appears on the home screen and opens like an app (no browser UI).

**If “Install” doesn’t appear**  
- Use the site over **HTTPS** (Netlify gives this by default).  
- Some browsers only show the install option after a short visit or after the service worker has registered; refresh once and check the address bar or menu again.  
- For best support, add **icons** (e.g. 192×192 and 512×512) to the PWA manifest in `vite.config.ts`; without them, some browsers may not show the install prompt.

## Option 2: Deploy by dragging a folder

1. Locally run:
   ```bash
   npm run build
   ```
2. Open [Netlify Drop](https://app.netlify.com/drop) and drag the **`dist`** folder onto the page. Netlify will host it and give you a URL.

Good for a one-off or quick test; for ongoing updates, use the Git flow above.

## What’s in this repo

- **`netlify.toml`** – Tells Netlify to run `npm run build`, publish `dist`, and use SPA redirects (so direct links and refresh work if you add routing later).

## Other similar options

- **[Vercel](https://vercel.com)** – Connect repo, same idea; often auto-detects Vite.
- **[Cloudflare Pages](https://pages.cloudflare.com)** – Git or upload; build command `npm run build`, output `dist`.
- **TransIP** – Manual upload; see [DEPLOYMENT-TransIP.md](DEPLOYMENT-TransIP.md).

All of these can host this app; Netlify and Vercel are the quickest if you use Git.
