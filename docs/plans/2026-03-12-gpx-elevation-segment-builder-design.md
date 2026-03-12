# GPX Elevation Profile + Segment Builder — Design

**Date:** 2026-03-12  
**Status:** Approved

---

## Summary

Add an alternative segment-creation path to the Edit Segments screen. Instead of typing values manually, the user uploads a GPX file, sees an interactive inline elevation profile, places split markers to define segment boundaries, and confirms — at which point segment specs (distance, ascent, descent) are derived automatically from the track data.

---

## User Flow

### Empty state
The existing `Add` button is replaced by two buttons side by side:
- `+ MANUAL` — same behaviour as the current add button (manual segment row)
- `+ UPLOAD` — triggers a hidden `<input type="file" accept=".gpx">`

### After GPX upload
- The GPX file is parsed immediately in the browser (no server involved).
- The Edit Segments screen displays the elevation profile chart inline, above the divider and Done button.
- Start and end markers are fixed; no segment split markers exist yet.
- A placeholder row below the chart hints to place markers.

### After markers are set
- The segment list renders below the chart (scrollable).
- Each segment shows: index, editable name field (blank), and read-only DISTANCE / ASCENT / DESCENT.
- Values update reactively as markers are moved.
- Tapping `+ DONE` replaces all existing segments for the current day with the derived ones. GPX data is then discarded.

Manual segments can still be added via `+ MANUAL` (these appear in the same list and are editable).

---

## GPX Parsing (`src/lib/gpx.ts`)

Uses the browser's native `DOMParser` — no library dependency.

Input: GPX file string  
Output: `TrackPoint[]`

```ts
interface TrackPoint {
  distance: number;   // cumulative km from start (Haversine)
  elevation: number;  // metres
}
```

- Extracts all `<trkpt>` elements from the first `<trk>/<trkseg>`
- Computes cumulative distance using the Haversine formula between consecutive lat/lon pairs
- Reads `<ele>` for elevation

---

## Elevation Profile Chart (`src/components/ElevationProfile.tsx`)

Full-width SVG rendered inline on the Edit Segments screen.

### Visual elements
- **Area fill** — semi-transparent fill below the elevation curve
- **Profile line** — smooth SVG `<path>` through downsampled track points (~200 points)
- **Split markers** — draggable `<circle>` elements that snap to the nearest track point
- **Dashed vertical lines** — dropped from each marker to the x-axis
- **Hover tooltip** — shows current distance (km) and elevation (m) on pointer move

### Interactions
| Action | Effect |
|--------|--------|
| Click on line | Places a new split marker |
| Drag a marker | Repositions it horizontally |
| Click an existing marker | Removes it |

### Props
```ts
interface ElevationProfileProps {
  points: TrackPoint[];
  onSegmentsChange: (segments: DerivedSegment[]) => void;
}
```

The component owns split marker state. It calls `onSegmentsChange` reactively whenever markers are added, moved, or removed.

---

## Segment Derivation

Given split marker distances `[0, d1, d2, ..., totalDistance]`, for each interval:

- **Distance** — `d[i+1] - d[i]` (km, 2 decimal places)
- **Ascent** — sum of positive elevation deltas between track points in range (m, integer)
- **Descent** — sum of absolute negative elevation deltas in range (m, integer)

```ts
interface DerivedSegment {
  distance: number;
  ascent: number;
  descent: number;
  name: string; // initially blank
}
```

---

## Segment Preview (`src/components/GpxSegmentPreview.tsx`)

Renders the derived segment list below the chart. Each row shows:
- Segment index
- Editable name field (blank by default)
- Read-only DISTANCE / ASCENT / DESCENT values

---

## Component Architecture

### New files
| File | Purpose |
|------|---------|
| `src/lib/gpx.ts` | GPX XML → `TrackPoint[]` |
| `src/components/ElevationProfile.tsx` | Interactive SVG chart |
| `src/components/GpxSegmentPreview.tsx` | Derived segment list |

### Modified files
| File | Change |
|------|--------|
| `src/components/EditSegmentsScreen.tsx` | Replace Add with Manual/Upload buttons; add upload state and inline profile |
| `src/stores/hikeStore.ts` | Add `replaceSegments` action (replace all segments in one call) |

### No changes needed
- `src/types/index.ts` — GPX data is not persisted; `Segment` type is unchanged
- All other files

---

## Constraints & Decisions

- **No new chart library** — custom SVG only; keeps bundle size unchanged
- **GPX data not persisted** — discarded after confirm; only derived segment values are saved
- **Replace on confirm** — GPX-derived segments replace all existing segments for the day
- **Segment names blank** — user fills them in after confirming
- **Mobile-first** — drag interactions must work on touch (use `pointermove`/`pointerup` not mouse events)
