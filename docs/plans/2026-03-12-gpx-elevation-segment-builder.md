# GPX Elevation Segment Builder — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow users to upload a GPX file on the Edit Segments screen, interactively place split markers on an inline elevation profile, and auto-populate segment specs (distance, ascent, descent).

**Architecture:** Three new files (`src/lib/gpx.ts`, `src/components/ElevationProfile.tsx`, `src/components/GpxSegmentPreview.tsx`) plus modifications to `EditSegmentsScreen.tsx` and `hikeStore.ts`. All GPX data is local component state — nothing new is persisted. The elevation profile is a hand-crafted SVG with pointer-event-based drag interactions.

**Tech Stack:** React 19, TypeScript, Tailwind v4, Zustand, Vite — no new dependencies.

---

## Reference

Design doc: `docs/plans/2026-03-12-gpx-elevation-segment-builder-design.md`

Key types already in `src/types/index.ts`:
```ts
interface Segment {
  id: string;
  name?: string;
  distance: number; // km
  ascent: number;   // m
  descent: number;  // m
  plannedDuration?: number;
  actualArrivalTime?: string;
}
```

Existing store action to use: `addSegment(segment: Omit<Segment, "id" | "plannedDuration">)`
New store action to add: `replaceSegments(segments: Omit<Segment, "id" | "plannedDuration">[])`

---

## Task 1: GPX Parser (`src/lib/gpx.ts`)

**Files:**
- Create: `src/lib/gpx.ts`

This is pure logic with no UI — start here so later tasks can build on it.

**Step 1: Create `src/lib/gpx.ts` with the types and Haversine helper**

```ts
export interface TrackPoint {
  distance: number;   // cumulative km from start
  elevation: number;  // metres
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function parseGpx(xml: string): TrackPoint[] {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const trkpts = Array.from(doc.querySelectorAll("trkpt"));
  if (trkpts.length === 0) return [];

  const points: TrackPoint[] = [];
  let cumDist = 0;
  let prevLat: number | null = null;
  let prevLon: number | null = null;

  for (const pt of trkpts) {
    const lat = parseFloat(pt.getAttribute("lat") ?? "0");
    const lon = parseFloat(pt.getAttribute("lon") ?? "0");
    const ele = parseFloat(pt.querySelector("ele")?.textContent ?? "0");

    if (prevLat !== null && prevLon !== null) {
      cumDist += haversineKm(prevLat, prevLon, lat, lon);
    }

    points.push({ distance: cumDist, elevation: ele });
    prevLat = lat;
    prevLon = lon;
  }

  return points;
}
```

**Step 2: Verify it compiles**

```bash
cd "/Users/rogierresoluut.com/Documents/Coding/Hiking Tracker" && npx tsc --noEmit
```

Expected: no errors

**Step 3: Commit**

```bash
git add src/lib/gpx.ts
git commit -m "feat: add GPX parser utility"
```

---

## Task 2: Add `replaceSegments` to the store

**Files:**
- Modify: `src/stores/hikeStore.ts`

**Step 1: Add the action to the `HikeState` interface** (after `removeSegment` line ~43)

```ts
replaceSegments: (segments: Omit<Segment, "id" | "plannedDuration">[]) => void;
```

**Step 2: Implement the action** (inside the `create` call, after `removeSegment`):

```ts
replaceSegments: (segments) => {
  const { durationFormula } = get();
  const newSegments: Segment[] = segments.map((s) => ({
    ...s,
    id: generateId(),
    plannedDuration: evaluateDuration(durationFormula, s.distance, s.ascent, s.descent),
  }));
  set({ segments: newSegments });
  get().persist();
},
```

**Step 3: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

**Step 4: Commit**

```bash
git add src/stores/hikeStore.ts
git commit -m "feat: add replaceSegments store action"
```

---

## Task 3: Segment derivation helper (`src/lib/gpx.ts` — extend)

**Files:**
- Modify: `src/lib/gpx.ts`

This adds the function that takes track points + split distances and returns derived segment specs. Keeping it in `gpx.ts` keeps all GPX logic in one place.

**Step 1: Add types and `deriveSegments` to `src/lib/gpx.ts`**

```ts
export interface DerivedSegment {
  distance: number;  // km, 2dp
  ascent: number;    // m integer
  descent: number;   // m integer
  name: string;      // blank
}

/**
 * Given track points and an array of split distances (including 0 and total),
 * derive segment specs for each interval.
 */
export function deriveSegments(
  points: TrackPoint[],
  splitDistances: number[]
): DerivedSegment[] {
  const sorted = [...splitDistances].sort((a, b) => a - b);

  return sorted.slice(0, -1).map((start, i) => {
    const end = sorted[i + 1];
    const interval = points.filter(
      (p) => p.distance >= start && p.distance <= end
    );

    let ascent = 0;
    let descent = 0;
    for (let j = 1; j < interval.length; j++) {
      const delta = interval[j].elevation - interval[j - 1].elevation;
      if (delta > 0) ascent += delta;
      else descent += Math.abs(delta);
    }

    return {
      distance: Math.round((end - start) * 100) / 100,
      ascent: Math.round(ascent),
      descent: Math.round(descent),
      name: "",
    };
  });
}
```

**Step 2: Verify it compiles**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add src/lib/gpx.ts
git commit -m "feat: add deriveSegments helper"
```

---

## Task 4: Elevation Profile SVG component (`src/components/ElevationProfile.tsx`)

**Files:**
- Create: `src/components/ElevationProfile.tsx`

This is the most complex task. Build it in sub-steps.

**Step 1: Scaffold the component with coordinate mapping only**

```tsx
import { useRef, useState, useCallback } from "react";
import type { TrackPoint, DerivedSegment } from "../lib/gpx";
import { deriveSegments } from "../lib/gpx";

interface ElevationProfileProps {
  points: TrackPoint[];
  onSegmentsChange: (segments: DerivedSegment[]) => void;
}

const W = 358; // SVG viewBox width (matches 390px - 32px padding)
const H = 160; // SVG viewBox height
const PAD = { top: 12, right: 8, bottom: 24, left: 8 };

function toSvgX(dist: number, totalDist: number) {
  return PAD.left + (dist / totalDist) * (W - PAD.left - PAD.right);
}

function toSvgY(ele: number, minEle: number, maxEle: number) {
  const range = maxEle - minEle || 1;
  return PAD.top + (1 - (ele - minEle) / range) * (H - PAD.top - PAD.bottom);
}

export function ElevationProfile({ points, onSegmentsChange }: ElevationProfileProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [splitDistances, setSplitDistances] = useState<number[]>([]);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  const totalDist = points[points.length - 1]?.distance ?? 1;
  const elevations = points.map((p) => p.elevation);
  const minEle = Math.min(...elevations);
  const maxEle = Math.max(...elevations);

  // Build smooth SVG path
  const pathData = points
    .map((p, i) => {
      const x = toSvgX(p.distance, totalDist);
      const y = toSvgY(p.elevation, minEle, maxEle);
      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(" ");

  // Area path (close to bottom)
  const areaData =
    pathData +
    ` L ${toSvgX(totalDist, totalDist)} ${H - PAD.bottom}` +
    ` L ${PAD.left} ${H - PAD.bottom} Z`;

  // Find elevation at a given cumulative distance (nearest point)
  const eleAtDist = useCallback(
    (dist: number) => {
      let nearest = points[0];
      let minDiff = Infinity;
      for (const p of points) {
        const diff = Math.abs(p.distance - dist);
        if (diff < minDiff) { minDiff = diff; nearest = p; }
      }
      return nearest.elevation;
    },
    [points]
  );

  // Convert SVG clientX to a snapped distance value
  const svgXToDist = useCallback(
    (clientX: number) => {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return 0;
      const svgX = ((clientX - rect.left) / rect.width) * W;
      const raw = ((svgX - PAD.left) / (W - PAD.left - PAD.right)) * totalDist;
      const clamped = Math.max(0, Math.min(totalDist, raw));
      // Snap to nearest track point
      let nearest = points[0];
      let minDiff = Infinity;
      for (const p of points) {
        const diff = Math.abs(p.distance - clamped);
        if (diff < minDiff) { minDiff = diff; nearest = p; }
      }
      return nearest.distance;
    },
    [points, totalDist]
  );

  const updateSplits = useCallback(
    (newSplits: number[]) => {
      setSplitDistances(newSplits);
      const allSplits = [0, ...newSplits, totalDist];
      onSegmentsChange(deriveSegments(points, allSplits));
    },
    [points, totalDist, onSegmentsChange]
  );

  // Click on SVG background → add or remove marker
  const handleSvgClick = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (draggingIndex !== null) return;
      const dist = svgXToDist(e.clientX);
      // Check if near an existing marker (within ~5% of total)
      const threshold = totalDist * 0.03;
      const nearIdx = splitDistances.findIndex((d) => Math.abs(d - dist) < threshold);
      if (nearIdx !== -1) {
        updateSplits(splitDistances.filter((_, i) => i !== nearIdx));
      } else {
        updateSplits([...splitDistances, dist].sort((a, b) => a - b));
      }
    },
    [draggingIndex, svgXToDist, splitDistances, totalDist, updateSplits]
  );

  // Drag handlers
  const handleMarkerPointerDown = useCallback(
    (e: React.PointerEvent, index: number) => {
      e.stopPropagation();
      (e.target as Element).setPointerCapture(e.pointerId);
      setDraggingIndex(index);
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (draggingIndex === null) return;
      const dist = svgXToDist(e.clientX);
      const newSplits = [...splitDistances];
      newSplits[draggingIndex] = dist;
      newSplits.sort((a, b) => a - b);
      updateSplits(newSplits);
    },
    [draggingIndex, svgXToDist, splitDistances, updateSplits]
  );

  const handlePointerUp = useCallback(() => {
    setDraggingIndex(null);
  }, []);

  // Axis labels (x: distance ticks every ~10km or auto)
  const tickCount = Math.min(5, Math.floor(totalDist));
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) =>
    Math.round((totalDist / tickCount) * i * 10) / 10
  );

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      className="w-full touch-none select-none"
      style={{ height: H }}
      onPointerDown={handleSvgClick}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Area fill */}
      <path d={areaData} fill="#0b0b0b" fillOpacity={0.08} />

      {/* Profile line */}
      <path d={pathData} fill="none" stroke="#0b0b0b" strokeWidth={1.5} strokeLinejoin="round" />

      {/* Split markers */}
      {splitDistances.map((dist, i) => {
        const x = toSvgX(dist, totalDist);
        const y = toSvgY(eleAtDist(dist), minEle, maxEle);
        return (
          <g key={i}>
            <line
              x1={x} y1={PAD.top} x2={x} y2={H - PAD.bottom}
              stroke="#0b0b0b" strokeWidth={1} strokeDasharray="3 3"
            />
            <circle
              cx={x} cy={y} r={6}
              fill="#f8f8f8" stroke="#0b0b0b" strokeWidth={1.5}
              style={{ cursor: "grab" }}
              onPointerDown={(e) => handleMarkerPointerDown(e, i)}
            />
          </g>
        );
      })}

      {/* X-axis labels */}
      {ticks.map((t) => (
        <text
          key={t}
          x={toSvgX(t, totalDist)}
          y={H - 4}
          textAnchor="middle"
          fontSize={8}
          fill="#0b0b0b"
          fontFamily="TX-02, monospace"
          opacity={0.5}
        >
          {t}km
        </text>
      ))}
    </svg>
  );
}
```

**Step 2: Verify it compiles**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add src/components/ElevationProfile.tsx
git commit -m "feat: add ElevationProfile SVG component"
```

---

## Task 5: GPX Segment Preview component (`src/components/GpxSegmentPreview.tsx`)

**Files:**
- Create: `src/components/GpxSegmentPreview.tsx`

**Step 1: Create the component**

```tsx
import type { DerivedSegment } from "../lib/gpx";

interface GpxSegmentPreviewProps {
  segments: DerivedSegment[];
  onNameChange: (index: number, name: string) => void;
}

export function GpxSegmentPreview({ segments, onNameChange }: GpxSegmentPreviewProps) {
  if (segments.length === 0) {
    return (
      <div className="flex items-center gap-[8px]">
        <div className="bg-[#d9d9d9] rounded-[2px] size-[12px] shrink-0" />
        <div className="bg-[#d9d9d9] h-[12px] rounded-[2px] shrink-0 w-[80px]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[24px]">
      {segments.map((seg, i) => (
        <div key={i} className="flex flex-col gap-[8px]">
          {/* Segment header with editable name */}
          <div className="flex items-center gap-[8px]">
            <span className="font-['TX-02'] text-[#0b0b0b] text-[14px] font-bold uppercase tracking-[-0.02em] leading-[0.85]">
              {i + 1}
            </span>
            <input
              type="text"
              placeholder="SEGMENT NAME"
              value={seg.name}
              onChange={(e) => onNameChange(i, e.target.value)}
              className="font-['TX-02'] text-[#0b0b0b] text-[14px] font-bold uppercase tracking-[-0.02em] leading-[0.85] bg-transparent border-none outline-none placeholder-[#d9d9d9] w-full"
            />
          </div>
          {/* Stats */}
          <div className="flex flex-col gap-[4px] pl-[20px]">
            <div className="flex gap-[16px]">
              <span className="font-['TX-02'] text-[#0b0b0b] text-[12px] uppercase tracking-[-0.02em] opacity-50 w-[64px]">DISTANCE</span>
              <span className="font-['TX-02'] text-[#0b0b0b] text-[12px] uppercase tracking-[-0.02em]">{seg.distance.toFixed(2)}KM</span>
            </div>
            <div className="flex gap-[16px]">
              <span className="font-['TX-02'] text-[#0b0b0b] text-[12px] uppercase tracking-[-0.02em] opacity-50 w-[64px]">ASCENT</span>
              <span className="font-['TX-02'] text-[#0b0b0b] text-[12px] uppercase tracking-[-0.02em]">+{seg.ascent}M</span>
            </div>
            <div className="flex gap-[16px]">
              <span className="font-['TX-02'] text-[#0b0b0b] text-[12px] uppercase tracking-[-0.02em] opacity-50 w-[64px]">DESCENT</span>
              <span className="font-['TX-02'] text-[#0b0b0b] text-[12px] uppercase tracking-[-0.02em]">-{seg.descent}M</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

**Step 2: Verify it compiles**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add src/components/GpxSegmentPreview.tsx
git commit -m "feat: add GpxSegmentPreview component"
```

---

## Task 6: Wire up EditSegmentsScreen

**Files:**
- Modify: `src/components/EditSegmentsScreen.tsx`

This is the integration task. Read the current file first before editing.

**Step 1: Add state and imports at the top**

Replace the existing imports block with:

```tsx
import { useRef, useState, useCallback } from "react";
import { useHikeStore } from "../stores/hikeStore";
import { Divider } from "../design-system";
import { IconAdd } from "../design-system/icons";
import { IconSegments } from "../design-system/icons";
import { SegmentRow } from "./SegmentRow";
import { ElevationProfile } from "./ElevationProfile";
import { GpxSegmentPreview } from "./GpxSegmentPreview";
import { parseGpx } from "../lib/gpx";
import type { DerivedSegment, TrackPoint } from "../lib/gpx";
```

**Step 2: Add GPX state inside the component** (after existing `useState` calls):

```tsx
const [gpxPoints, setGpxPoints] = useState<TrackPoint[] | null>(null);
const [derivedSegments, setDerivedSegments] = useState<DerivedSegment[]>([]);
const fileInputRef = useRef<HTMLInputElement>(null);
const replaceSegments = useHikeStore((s) => s.replaceSegments);

const handleNameChange = useCallback((index: number, name: string) => {
  setDerivedSegments((prev) =>
    prev.map((s, i) => (i === index ? { ...s, name } : s))
  );
}, []);

const handleUploadClick = () => fileInputRef.current?.click();

const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const xml = ev.target?.result as string;
    const points = parseGpx(xml);
    if (points.length > 0) {
      setGpxPoints(points);
      setDerivedSegments([]);
    }
  };
  reader.readAsText(file);
  // Reset input so same file can be re-uploaded
  e.target.value = "";
};

const handleConfirmGpx = () => {
  replaceSegments(derivedSegments.map((s) => ({
    name: s.name || undefined,
    distance: s.distance,
    ascent: s.ascent,
    descent: s.descent,
  })));
  setGpxPoints(null);
  setDerivedSegments([]);
  onDone();
};
```

**Step 3: Update the JSX**

Replace the `Add` button row with:

```tsx
{/* ADD / UPLOAD button row */}
<div className="flex items-center justify-between w-full">
  <div className="flex gap-[8px] items-center">
    <div className="bg-[#d9d9d9] rounded-[2px] size-[12px] shrink-0" />
    <div className="bg-[#d9d9d9] h-[12px] rounded-[2px] shrink-0 w-[32px]" />
  </div>
  <div className="flex gap-[8px]">
    <button
      type="button"
      onClick={handleAdd}
      className="bg-[#d9d9d9] flex gap-[4px] items-center justify-center px-[8px] py-[6px] rounded-[4px] shrink-0"
    >
      <IconAdd className="size-3 shrink-0" />
      <span className="font-['TX-02'] uppercase text-[#0b0b0b] text-[14px] font-normal tracking-[-0.02em] leading-[0.85]">
        Manual
      </span>
    </button>
    <button
      type="button"
      onClick={handleUploadClick}
      className="bg-[#d9d9d9] flex gap-[4px] items-center justify-center px-[8px] py-[6px] rounded-[4px] shrink-0"
    >
      <IconAdd className="size-3 shrink-0" />
      <span className="font-['TX-02'] uppercase text-[#0b0b0b] text-[14px] font-normal tracking-[-0.02em] leading-[0.85]">
        Upload
      </span>
    </button>
    <input
      ref={fileInputRef}
      type="file"
      accept=".gpx"
      className="hidden"
      onChange={handleFileChange}
    />
  </div>
</div>
```

After the button row, before `<Divider />`, add the elevation profile and preview (conditionally):

```tsx
{gpxPoints && (
  <div className="flex flex-col gap-[24px]">
    <ElevationProfile
      points={gpxPoints}
      onSegmentsChange={setDerivedSegments}
    />
    <GpxSegmentPreview
      segments={derivedSegments}
      onNameChange={handleNameChange}
    />
  </div>
)}
```

And update the Done button to show `Confirm` when GPX mode is active:

```tsx
<button
  type="button"
  onClick={gpxPoints ? handleConfirmGpx : onDone}
  className="bg-[#f86d23] flex gap-[4px] items-center justify-center px-[8px] py-[6px] rounded-[4px] shrink-0"
>
  <IconAdd className="size-3 shrink-0" />
  <span className="font-['TX-02'] uppercase text-[#0b0b0b] text-[14px] font-normal tracking-[-0.02em] leading-[0.85]">
    {gpxPoints ? "Confirm" : "Done"}
  </span>
</button>
```

**Step 4: Verify it compiles**

```bash
npx tsc --noEmit
```

**Step 5: Run the dev server and manually test**

```bash
npm run dev
```

Test:
1. Open Edit Segments screen — should show `+ MANUAL` and `+ UPLOAD` buttons
2. Click `+ MANUAL` — should add a manual segment row as before
3. Click `+ UPLOAD`, pick a `.gpx` file — elevation profile should appear
4. Click on the profile line — split markers should appear; segment list below should show stats
5. Drag a marker — stats should update reactively
6. Click `+ CONFIRM` — segments should be saved; should return to home screen
7. Verify saved segments appear in the segment list with correct distance/ascent/descent

**Step 6: Commit**

```bash
git add src/components/EditSegmentsScreen.tsx
git commit -m "feat: wire up GPX upload and elevation profile in EditSegmentsScreen"
```

---

## Task 7: Final polish pass

**Files:**
- Review: `src/components/ElevationProfile.tsx`
- Review: `src/components/GpxSegmentPreview.tsx`

**Step 1: Check lints**

```bash
npm run lint
```

Fix any reported issues.

**Step 2: Test on mobile viewport in browser DevTools**

- Set viewport to 390×844 (iPhone 14)
- Verify touch drag works on the elevation profile markers
- Verify the profile is full-width and readable

**Step 3: Commit any polish fixes**

```bash
git add -A
git commit -m "fix: elevation profile polish and lint fixes"
```

---

## Sample GPX for testing

Save this as `test.gpx` locally (do not commit):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1">
  <trk><trkseg>
    <trkpt lat="46.0" lon="7.0"><ele>1200</ele></trkpt>
    <trkpt lat="46.01" lon="7.01"><ele>1350</ele></trkpt>
    <trkpt lat="46.02" lon="7.02"><ele>1500</ele></trkpt>
    <trkpt lat="46.03" lon="7.03"><ele>1450</ele></trkpt>
    <trkpt lat="46.04" lon="7.04"><ele>1300</ele></trkpt>
    <trkpt lat="46.05" lon="7.05"><ele>1100</ele></trkpt>
    <trkpt lat="46.06" lon="7.06"><ele>1250</ele></trkpt>
    <trkpt lat="46.07" lon="7.07"><ele>1400</ele></trkpt>
    <trkpt lat="46.08" lon="7.08"><ele>1200</ele></trkpt>
  </trkseg></trk>
</gpx>
```
