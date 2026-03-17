# SVG Sprite Icon Library Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the current ad-hoc React icon components with a self-hosted SVG sprite sheet icon library, adding a build script, a single `<Icon>` component, and CSS base styles.

**Architecture:** Individual `.svg` files live in `public/icons/src/` and are merged into a single `public/icons/sprite.svg` by `scripts/build-sprite.mjs`. A thin `<Icon name="...">` React component references icons from the sprite via `<svg><use href="...">`. Named exports (`IconSummary`, etc.) are kept as backwards-compatible wrappers.

**Tech Stack:** Node.js ESM script (no dependencies), React, Tailwind CSS v4, Vite.

---

## Context: Existing Code

Before starting, read these files to understand the current state:
- `src/design-system/icons.tsx` — current icon components (mix of inline SVG and `<img>` tags)
- `src/design-system/icon-assets.ts` — Figma MCP asset URLs (will be deleted)
- `src/design-system/tokens.css` — design tokens
- `src/index.css` — global CSS imports

---

### Task 1: Create SVG source files from existing icons

**Files:**
- Create: `public/icons/src/summary.svg`
- Create: `public/icons/src/add.svg`
- Create: `public/icons/src/arrow-down.svg`
- Create: `public/icons/src/arrow-up.svg`
- Create: `public/icons/src/confirm.svg`
- Create: `public/icons/src/cancel.svg`
- Create: `public/icons/src/delete.svg`
- Create: `public/icons/src/nested.svg`

**Step 1: Create `public/icons/src/` directory**

```bash
mkdir -p public/icons/src
```

**Step 2: Create each SVG file**

Extract the SVG paths from `src/design-system/icons.tsx`. Each file should be a valid standalone SVG:

`public/icons/src/summary.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
  <path d="M 2 5 L 10 5 M 2 7 L 10 7" stroke="currentColor" stroke-width="1" stroke-linecap="square"/>
</svg>
```

`public/icons/src/add.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
  <path d="M 6 2 L 6 10 M 2 6 L 10 6" stroke="currentColor" stroke-width="1" stroke-linecap="square"/>
</svg>
```

`public/icons/src/arrow-down.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
  <path d="M 2.25 1 L 9.75 1 L 6 11 Z"/>
</svg>
```

`public/icons/src/arrow-up.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
  <path d="M 2.25 11 L 9.75 11 L 6 1 Z"/>
</svg>
```

`public/icons/src/confirm.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
  <path d="M 2.5 6.25 L 5 8.5 L 9.5 4" stroke="currentColor" stroke-width="1" stroke-linecap="square"/>
</svg>
```

`public/icons/src/cancel.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
  <path d="M 2.82 2.82 L 9.18 9.18 M 9.18 2.82 L 2.82 9.18" stroke="currentColor" stroke-width="1" stroke-linecap="square"/>
</svg>
```

`public/icons/src/delete.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
  <path d="M 2 6 L 10 6" stroke="currentColor" stroke-width="1" stroke-linecap="square"/>
</svg>
```

`public/icons/src/nested.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
  <path d="M 3 2.5 L 3 7.5 L 9.5 7.5" stroke="currentColor" stroke-width="1" stroke-linecap="square"/>
</svg>
```

**Note:** Icons that come from Figma MCP URLs (`segments`, `formula`, `edit`, `log`) need to be exported from Figma as `.svg` files and placed here too. For now, those four will remain as `<img>` fallbacks until Figma exports are available. Create placeholder files or skip them in Task 1 — they'll be wired up later.

**Step 3: Commit**

```bash
git add public/icons/src/
git commit -m "feat: add svg source files for inline icon paths"
```

---

### Task 2: Write the sprite build script

**Files:**
- Create: `scripts/build-sprite.mjs`

**Step 1: Create the scripts directory**

```bash
mkdir -p scripts
```

**Step 2: Create `scripts/build-sprite.mjs`**

```js
#!/usr/bin/env node
/**
 * Reads all .svg files from public/icons/src/
 * and generates a single SVG sprite at public/icons/sprite.svg.
 *
 * Usage: node scripts/build-sprite.mjs
 *   or:  npm run icons
 */

import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join, basename } from "path";

const SRC_DIR = "public/icons/src";
const OUT_FILE = "public/icons/sprite.svg";

const files = readdirSync(SRC_DIR).filter((f) => f.endsWith(".svg"));

if (files.length === 0) {
  console.error("No .svg files found in", SRC_DIR);
  process.exit(1);
}

const symbols = files.map((file) => {
  const name = basename(file, ".svg");
  const content = readFileSync(join(SRC_DIR, file), "utf8");

  // Extract viewBox from the root <svg> element
  const viewBoxMatch = content.match(/viewBox="([^"]+)"/);
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : "0 0 12 12";

  // Extract inner content (everything between <svg ...> and </svg>)
  const innerMatch = content.match(/<svg[^>]*>([\s\S]*?)<\/svg>/);
  const inner = innerMatch ? innerMatch[1].trim() : "";

  return `  <symbol id="icon-${name}" viewBox="${viewBox}">\n    ${inner}\n  </symbol>`;
});

const sprite = [
  `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">`,
  ...symbols,
  `</svg>`,
].join("\n");

writeFileSync(OUT_FILE, sprite, "utf8");
console.log(`✓ Sprite written to ${OUT_FILE} (${files.length} icons)`);
files.forEach((f) => console.log(`  · icon-${basename(f, ".svg")}`));
```

**Step 3: Run the script and verify output**

```bash
node scripts/build-sprite.mjs
```

Expected output:
```
✓ Sprite written to public/icons/sprite.svg (8 icons)
  · icon-summary
  · icon-add
  · icon-arrow-down
  · ...
```

Then check `public/icons/sprite.svg` exists and contains `<symbol id="icon-summary">` entries.

**Step 4: Add npm script to `package.json`**

In `package.json`, add to `"scripts"`:
```json
"icons": "node scripts/build-sprite.mjs"
```

**Step 5: Commit**

```bash
git add scripts/build-sprite.mjs public/icons/sprite.svg package.json
git commit -m "feat: add svg sprite build script and initial sprite"
```

---

### Task 3: Add CSS base styles

**Files:**
- Create: `src/design-system/icon-sprite.css`
- Modify: `src/index.css`

**Step 1: Create `src/design-system/icon-sprite.css`**

```css
/**
 * Base styles for SVG sprite icons.
 * Size via Tailwind size-* or font-size on the parent.
 * Color via currentColor — set text-* on the icon or a parent element.
 */
.icon {
  display: inline-block;
  width: 1em;
  height: 1em;
  fill: currentColor;
  stroke: currentColor;
  vertical-align: middle;
  flex-shrink: 0;
  overflow: visible;
}
```

**Step 2: Import in `src/index.css`**

Add after the existing `@import "./design-system/tokens.css";` line:

```css
@import "./design-system/icon-sprite.css";
```

**Step 3: Commit**

```bash
git add src/design-system/icon-sprite.css src/index.css
git commit -m "feat: add icon sprite CSS base styles"
```

---

### Task 4: Update `icons.tsx` with the `<Icon>` component

**Files:**
- Modify: `src/design-system/icons.tsx`
- Delete: `src/design-system/icon-assets.ts` (after migration)

**Step 1: Rewrite `src/design-system/icons.tsx`**

Replace the entire file contents with:

```tsx
/**
 * Icon components backed by the SVG sprite at /icons/sprite.svg.
 *
 * Usage:
 *   <Icon name="summary" />
 *   <Icon name="add" className="size-4 text-ds-orange" />
 *
 * Adding icons: drop a .svg into public/icons/src/, run `npm run icons`.
 *
 * Named exports below are backwards-compatible wrappers kept for existing call sites.
 * Prefer <Icon name="..."> for new code.
 */

const defaultClass = "icon size-3";

interface IconProps {
  name: string;
  className?: string;
}

export function Icon({ name, className = defaultClass }: IconProps) {
  return (
    <svg className={className} aria-hidden focusable="false">
      <use href={`/icons/sprite.svg#icon-${name}`} />
    </svg>
  );
}

// --- Backwards-compatible named exports ---

interface NamedIconProps {
  className?: string;
}

export function IconSummary({ className }: NamedIconProps) {
  return <Icon name="summary" className={className ?? defaultClass} />;
}

export function IconSegments({ className }: NamedIconProps) {
  return <Icon name="segments" className={className ?? defaultClass} />;
}

export function IconFormula({ className }: NamedIconProps) {
  return <Icon name="formula" className={className ?? defaultClass} />;
}

export function IconAdd({ className }: NamedIconProps) {
  return <Icon name="add" className={className ?? defaultClass} />;
}

export function IconEdit({ className }: NamedIconProps) {
  return <Icon name="edit" className={className ?? defaultClass} />;
}

export function IconArrowDown({ className }: NamedIconProps) {
  return <Icon name="arrow-down" className={className ?? defaultClass} />;
}

export function IconArrowUp({ className }: NamedIconProps) {
  return <Icon name="arrow-up" className={className ?? defaultClass} />;
}

export function IconLog({ className }: NamedIconProps) {
  return <Icon name="log" className={className ?? defaultClass} />;
}

export function IconConfirm({ className }: NamedIconProps) {
  return <Icon name="confirm" className={className ?? defaultClass} />;
}

export function IconCancel({ className }: NamedIconProps) {
  return <Icon name="cancel" className={className ?? defaultClass} />;
}

export function IconDelete({ className }: NamedIconProps) {
  return <Icon name="delete" className={className ?? defaultClass} />;
}

export function IconNested({ className }: NamedIconProps) {
  return <Icon name="nested" className={className ?? defaultClass} />;
}
```

**Step 2: Delete `src/design-system/icon-assets.ts`**

```bash
rm src/design-system/icon-assets.ts
```

**Step 3: Verify no remaining imports of `icon-assets`**

```bash
grep -r "icon-assets" src/
```

Expected: no output (no remaining imports).

**Step 4: Check `src/design-system/index.ts` exports**

Read `src/design-system/index.ts`. If it re-exports from `icon-assets`, remove that line. Add `export { Icon } from "./icons"` if not already present.

**Step 5: Start the dev server and visually verify icons render**

```bash
npm run dev
```

Open the app in the browser. Check that all icons that were visible before are still visible. The icons backed by Figma MCP URLs (`segments`, `formula`, `edit`, `log`) will render as broken until their SVG files are added in Task 5.

**Step 6: Commit**

```bash
git add src/design-system/icons.tsx src/design-system/index.ts
git rm src/design-system/icon-assets.ts
git commit -m "feat: migrate icons to svg sprite, add Icon component"
```

---

### Task 5: Export Figma-sourced icons and add to sprite

**Files:**
- Create: `public/icons/src/segments.svg`
- Create: `public/icons/src/formula.svg`
- Create: `public/icons/src/edit.svg`
- Create: `public/icons/src/log.svg`

**Step 1: Export from Figma**

In Figma, select each icon component, export as SVG (12×12, no background). Save each file to `public/icons/src/` with the matching filename.

**Step 2: Rebuild the sprite**

```bash
npm run icons
```

Expected: now reports 12 icons instead of 8.

**Step 3: Verify in the browser**

Restart dev server or hard-refresh. The previously broken icons (`segments`, `formula`, `edit`, `log`) should now render correctly.

**Step 4: Commit**

```bash
git add public/icons/src/ public/icons/sprite.svg
git commit -m "feat: add figma-exported svg icons to sprite"
```

---

## Done

At this point the icon library is fully operational:

- Drop a `.svg` into `public/icons/src/`
- Run `npm run icons`
- Use `<Icon name="my-icon" />` anywhere in the app

All existing `IconSummary`, `IconAdd`, etc. call sites continue to work without changes.
