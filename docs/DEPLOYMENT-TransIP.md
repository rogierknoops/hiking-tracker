# Deploying Hiking Tracker to TransIP

This app is a **static site** (Vite + React). No server-side runtime or database is required. You only need to build it and upload the output to TransIP Web Hosting.

## Prerequisites

- A **domain** (at TransIP or elsewhere) that you will point to TransIP
- A **TransIP Web Hosting** package for that domain ([order here](https://www.transip.eu/webhosting/))
- SFTP credentials from TransIP (Control Panel → Shared Hosting → your domain → Site → SFTP/SSH)

## 1. Build the app

From the project root:

```bash
npm install
npm run build
```

The built site is in the **`dist/`** folder (e.g. `index.html`, `assets/`, `manifest.webmanifest`, service worker files).

## 2. Upload to TransIP

TransIP expects your site files in the **`www`** folder of your Web Hosting.

- **Option A – SFTP (recommended)**  
  Use [FileZilla](https://www.transip.eu/knowledgebase/5900-how-use-sftp-with-filezilla/) or [Cyberduck](https://www.transip.eu/knowledgebase/5957-how-use-sftp-with-cyberduck/) with the SFTP host, username, and password from the control panel.  
  Upload the **contents** of your local `dist/` folder into the remote **`www`** folder (so `index.html` and the rest sit inside `www/`).

- **Option B – File Manager**  
  In the control panel: Shared Hosting → your domain → File Manager. Upload the contents of `dist/` into `www/`. Fine for small updates; SFTP is better for full deploys.

## 3. Point your domain to TransIP

- In the [TransIP control panel](https://www.transip.eu/cp/): **Domain** → select your domain.
- If you see **Domain settings**, ensure **TransIP settings** are **On** so the domain points to your Web Hosting.
- If you see **Advanced domain settings**, use **Bulk options** → **Copy from** → **TransIP default DNS settings**, then **Save**.  
  DNS can take up to 24 hours to propagate.

## 4. Check the site

- **TransURL (before DNS):** In Shared Hosting → Site → SFTP/SSH, the host is shown; replace `ssh` with `site` to get a URL like `yourcode.site.transip.me`. Use it to verify the site works before switching DNS.
- **Your domain:** After DNS points to TransIP, open your domain in a browser; the app should load and work offline (PWA) as designed.

## Deploying updates

1. Run `npm run build` again.
2. Re-upload the contents of `dist/` to the `www` folder (overwrite existing files).

You can use `npm run deploy` to build and then follow the printed reminder to upload `dist/` via SFTP.

## Subpath (optional)

If the site must run in a subpath (e.g. `https://example.com/hiking/`), set the base in `vite.config.ts`:

```ts
export default defineConfig({
  base: '/hiking/',
  // ...
})
```

Then rebuild and upload; the app will use that base path for assets and the PWA.
