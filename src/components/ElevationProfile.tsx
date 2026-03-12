import { useRef, useState, useCallback, useMemo } from "react";
import type { TrackPoint, DerivedSegment } from "../lib/gpx";
import { deriveSegments } from "../lib/gpx";

interface ElevationProfileProps {
  points: TrackPoint[];
  onSegmentsChange: (segments: DerivedSegment[]) => void;
}

const W = 358; // SVG viewBox width (matches 390px - 32px padding)
const H = 152; // SVG viewBox height — matches Figma
const PAD = { top: 12, right: 8, bottom: 8, left: 8 };

function toSvgX(dist: number, totalDist: number) {
  return PAD.left + (dist / totalDist) * (W - PAD.left - PAD.right);
}

function toSvgY(ele: number, minEle: number, maxEle: number) {
  const range = maxEle - minEle || 1;
  return PAD.top + (1 - (ele - minEle) / range) * (H - PAD.top - PAD.bottom);
}

/** Reduce to at most maxN evenly-spaced samples, keeping first and last. */
function downsample(pts: TrackPoint[], maxN: number): TrackPoint[] {
  if (pts.length <= maxN) return pts;
  const step = (pts.length - 1) / (maxN - 1);
  return Array.from({ length: maxN }, (_, i) => pts[Math.round(i * step)]);
}

/** Smooth elevation values with a simple moving average. */
function smoothElevations(pts: TrackPoint[], window: number): TrackPoint[] {
  const half = Math.floor(window / 2);
  return pts.map((p, i) => {
    const slice = pts.slice(Math.max(0, i - half), Math.min(pts.length, i + half + 1));
    const avg = slice.reduce((s, q) => s + q.elevation, 0) / slice.length;
    return { ...p, elevation: avg };
  });
}

/** Catmull-Rom spline → cubic bezier SVG path through {x,y} points. */
function catmullRomPath(pts: { x: number; y: number }[], tension = 0.4): string {
  if (pts.length < 2) return "";
  const f = (n: number) => n.toFixed(2);
  let d = `M ${f(pts[0].x)} ${f(pts[0].y)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;
    d += ` C ${f(cp1x)} ${f(cp1y)}, ${f(cp2x)} ${f(cp2y)}, ${f(p2.x)} ${f(p2.y)}`;
  }
  return d;
}

export function ElevationProfile({ points, onSegmentsChange }: ElevationProfileProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [splitDistances, setSplitDistances] = useState<number[]>([]);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  // Last-interacted marker stays visually selected after release
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  // Tracks whether the current drag has moved — used to distinguish tap-to-remove from drag
  const dragMoved = useRef(false);

  const totalDist = points[points.length - 1]?.distance ?? 1;
  const elevations = points.map((p) => p.elevation);
  const minEle = Math.min(...elevations);
  const maxEle = Math.max(...elevations);

  // Downsample + smooth for display only; original points used for segment derivation
  const displayPoints = useMemo(
    () => smoothElevations(downsample(points, 200), 5),
    [points]
  );

  const svgPts = useMemo(
    () => displayPoints.map((p) => ({
      x: toSvgX(p.distance, totalDist),
      y: toSvgY(p.elevation, minEle, maxEle),
    })),
    [displayPoints, totalDist, minEle, maxEle]
  );

  const pathData = useMemo(() => catmullRomPath(svgPts), [svgPts]);

  // Area path closes the curve to the bottom of the chart
  const areaData = useMemo(
    () =>
      pathData +
      ` L ${toSvgX(totalDist, totalDist)} ${H - PAD.bottom}` +
      ` L ${PAD.left} ${H - PAD.bottom} Z`,
    [pathData, totalDist]
  );

  // Find elevation at a given cumulative distance using smoothed display points
  // so markers sit on the visible line
  const eleAtDist = useCallback(
    (dist: number) => {
      let nearest = displayPoints[0];
      let minDiff = Infinity;
      for (const p of displayPoints) {
        const diff = Math.abs(p.distance - dist);
        if (diff < minDiff) { minDiff = diff; nearest = p; }
      }
      return nearest.elevation;
    },
    [displayPoints]
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

  // PointerDown on SVG background → start dragging a new marker
  const handleSvgPointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (draggingIndex !== null) return;
      const dist = svgXToDist(e.clientX);
      const newSplits = [...splitDistances, dist].sort((a, b) => a - b);
      const newIdx = newSplits.indexOf(dist);
      e.currentTarget.setPointerCapture(e.pointerId);
      dragMoved.current = true; // treat new-marker placement as already "moved"
      setSplitDistances(newSplits);
      setDraggingIndex(newIdx);
      setSelectedIndex(newIdx);
      onSegmentsChange(deriveSegments(points, [0, ...newSplits, totalDist]));
    },
    [draggingIndex, svgXToDist, splitDistances, totalDist, points, onSegmentsChange]
  );

  // Drag handlers

  const handleMarkerPointerDown = useCallback(
    (e: React.PointerEvent, index: number) => {
      e.stopPropagation();
      (e.target as Element).setPointerCapture(e.pointerId);
      dragMoved.current = false;
      setDraggingIndex(index);
      setSelectedIndex(index);
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (draggingIndex === null) return;
      const dist = svgXToDist(e.clientX);
      const newSplits = [...splitDistances];
      if (newSplits[draggingIndex] === dist) return;
      dragMoved.current = true;
      newSplits[draggingIndex] = dist;
      newSplits.sort((a, b) => a - b);
      const newIdx = newSplits.indexOf(dist);
      if (newIdx !== draggingIndex) setDraggingIndex(newIdx);
      updateSplits(newSplits);
    },
    [draggingIndex, svgXToDist, splitDistances, updateSplits]
  );

  const handlePointerUp = useCallback(() => {
    // Tap on a marker (no drag movement) → remove it
    if (draggingIndex !== null && !dragMoved.current) {
      updateSplits(splitDistances.filter((_, i) => i !== draggingIndex));
      setSelectedIndex(null);
    }
    setDraggingIndex(null);
  }, [draggingIndex, dragMoved, splitDistances, updateSplits]);

  if (points.length === 0) return null;

  return (
    <div className="flex flex-col gap-[8px] w-full">
      {/* Title */}
      <span className="font-['TX-02'] uppercase text-[#0b0b0b] text-[14px] font-normal tracking-[-0.02em] leading-[0.85] whitespace-nowrap">
        Elevation Profile
      </span>

      {/* Chart */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full touch-none select-none"
        style={{ height: H }}
        onPointerDown={handleSvgPointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Area fill */}
        <path d={areaData} fill="#0b0b0b" fillOpacity={0.08} />

        {/* Profile line */}
        <path d={pathData} fill="none" stroke="#0b0b0b" strokeWidth={1.5} strokeLinejoin="round" />

        {/* Split markers — solid orange circles; selected marker is larger */}
        {splitDistances.map((dist, i) => {
          const x = toSvgX(dist, totalDist);
          const y = toSvgY(eleAtDist(dist), minEle, maxEle);
          const isSelected = i === selectedIndex;
          const isDragging = i === draggingIndex;
          return (
            <g key={dist}>
              {/* Crosshairs — only visible while actively dragging this marker */}
              {isDragging && (
                <>
                  <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y}
                    stroke="#f86d23" strokeWidth={1} strokeOpacity={0.4} />
                  <line x1={x} y1={PAD.top} x2={x} y2={H - PAD.bottom}
                    stroke="#f86d23" strokeWidth={1} strokeOpacity={0.4} />
                </>
              )}
              <circle
                cx={x} cy={y} r={isSelected ? 4.5 : 2.5}
                fill="#f86d23" stroke="#0b0b0b" strokeWidth={1}
                style={{ cursor: "grab" }}
                onPointerDown={(e) => handleMarkerPointerDown(e, i)}
              />
            </g>
          );
        })}
      </svg>

      {/* Distance labels */}
      <div className="flex items-start justify-between w-full">
        <span className="font-['TX-02'] uppercase text-[#8c8c8c] text-[14px] font-normal tracking-[-0.02em] leading-[0.85] whitespace-nowrap">
          0 KM
        </span>
        <span className="font-['TX-02'] uppercase text-[#8c8c8c] text-[14px] font-normal tracking-[-0.02em] leading-[0.85] whitespace-nowrap">
          {totalDist.toFixed(2)} KM
        </span>
      </div>
    </div>
  );
}
