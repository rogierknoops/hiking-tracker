# SVG Sprite Icon Library Design

**Date:** 2026-03-17  
**Status:** Approved

## Overview

Replace the current mix of React icon components (inline SVG + Figma MCP URL `<img>` tags) in `src/design-system/icons.tsx` with a self-hosted SVG sprite sheet icon library. Icons are exported from Figma as individual `.svg` files, merged into a single `sprite.svg` by a Node build script, and referenced via a thin `<Icon>` React component. The sprite approach mirrors how professional icon libraries (like Font Awesome) work, but is entirely custom and local.

## File Structure

```
public/
  icons/
    sprite.svg              ← generated sprite (committed to git)
    src/                    ← raw .svg exports from Figma
      summary.svg
      segments.svg
      formula.svg
      add.svg
      edit.svg
      arrow-down.svg
      arrow-up.svg
      log.svg
      confirm.svg
      cancel.svg
      delete.svg
      nested.svg

scripts/
  build-sprite.mjs          ← Node script: reads src/*.svg → writes sprite.svg

src/design-system/
  icons.tsx                 ← updated: all icons use <Icon name="...">
  icon-sprite.css           ← CSS base styles for .icon class
  icon-assets.ts            ← removed (no longer needed)
  tokens.css                ← unchanged
  index.ts                  ← unchanged
```

## Sprite Format

`public/icons/sprite.svg` is a hidden SVG file containing one `<symbol>` per icon:

```svg
<svg xmlns="http://www.w3.org/2000/svg" style="display:none">
  <symbol id="icon-summary" viewBox="0 0 12 12">
    <!-- inner SVG paths -->
  </symbol>
  <symbol id="icon-add" viewBox="0 0 12 12">
    <!-- inner SVG paths -->
  </symbol>
</svg>
```

- Each symbol has a unique `id` matching the icon name: `icon-<name>`
- `viewBox` is preserved from the source file
- The sprite is committed to git — no runtime build step required

## Icon Component

A single `<Icon>` wrapper component replaces all individual icon exports:

```tsx
interface IconProps {
  name: string;
  className?: string;
}

export function Icon({ name, className = "icon" }: IconProps) {
  return (
    <svg className={`icon ${className}`} aria-hidden>
      <use href={`/icons/sprite.svg#icon-${name}`} />
    </svg>
  );
}
```

Usage:

```tsx
<Icon name="summary" />
<Icon name="add" className="size-4 text-ds-orange" />
```

Named exports (`IconSummary`, `IconAdd`, etc.) are kept as thin wrappers around `<Icon>` for backwards compatibility with existing call sites.

## CSS Base Styles (`icon-sprite.css`)

```css
.icon {
  display: inline-block;
  width: 1em;
  height: 1em;
  fill: currentColor;
  stroke: currentColor;
  vertical-align: middle;
  flex-shrink: 0;
}
```

Imported in `src/index.css` alongside `tokens.css`. Size is controlled via Tailwind `size-*` classes or `font-size`. Color inherits via `currentColor`.

## Build Script (`scripts/build-sprite.mjs`)

Node ESM script that:
1. Reads all `.svg` files from `public/icons/src/`
2. Parses each file, extracts `viewBox` and inner content
3. Wraps each in a `<symbol id="icon-<filename>">` tag
4. Writes the combined sprite to `public/icons/sprite.svg`

Run manually: `node scripts/build-sprite.mjs`

Optionally added to `package.json` scripts as `"icons": "node scripts/build-sprite.mjs"`.

## Migration

Existing icons in `icons.tsx` are SVG paths — these are migrated by:
1. Saving each path as a `.svg` file in `public/icons/src/`
2. Running the build script to generate the sprite
3. Updating `icons.tsx` to use `<Icon name="...">` wrappers
4. Deleting `icon-assets.ts` (Figma MCP URLs replaced by local files)

## Adding New Icons

1. Export the icon from Figma as `.svg` into `public/icons/src/`
2. Run `npm run icons`
3. Use `<Icon name="my-icon" />` in any component
