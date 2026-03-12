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
  // Tracks whether the current drag has moved — used to distinguish tap-to-remove from drag
  const dragMoved = useRef(false);

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
    }
    setDraggingIndex(null);
  }, [draggingIndex, dragMoved, splitDistances, updateSplits]);

  if (points.length === 0) return null;

  // Axis labels (x: distance ticks)
  const tickCount = Math.max(1, Math.min(5, Math.floor(totalDist)));
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) =>
    Math.round((totalDist / tickCount) * i * 10) / 10
  );

  return (
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

      {/* Split markers */}
      {splitDistances.map((dist, i) => {
        const x = toSvgX(dist, totalDist);
        const y = toSvgY(eleAtDist(dist), minEle, maxEle);
        return (
          <g key={dist}>
            <line
              x1={x} y1={y} x2={x} y2={H - PAD.bottom}
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
