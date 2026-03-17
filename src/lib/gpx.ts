import type { TrackPoint } from "../types";
export type { TrackPoint };

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
    const latStr = pt.getAttribute("lat");
    const lonStr = pt.getAttribute("lon");
    if (latStr === null || lonStr === null) continue;
    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);
    if (isNaN(lat) || isNaN(lon)) continue;

    const eleText = pt.querySelector("ele")?.textContent ?? "0";
    const ele = parseFloat(eleText) || 0;

    if (prevLat !== null) {
      cumDist += haversineKm(prevLat, prevLon!, lat, lon);
    }

    points.push({ distance: cumDist, elevation: ele });
    prevLat = lat;
    prevLon = lon;
  }

  return points;
}

export interface DerivedSegment {
  distance: number;  // km, 2dp
  ascent: number;    // m integer
  descent: number;   // m integer
  grade: number;     // net average grade as percentage (positive = net uphill)
  name: string;
}

export function gradeLabel(gradePercent: number): string {
  const abs = Math.abs(gradePercent);
  const up = gradePercent >= 0;
  if (abs <= 3)  return "Flat";
  if (abs <= 9)  return up ? "Gentle Climb"   : "Gentle Descent";
  if (abs <= 15) return up ? "Moderate Climb"  : "Moderate Descent";
  if (abs <= 30) return up ? "Steep Climb"     : "Steep Descent";
  if (abs <= 60) return up ? "Extreme Climb"   : "Extreme Descent";
  return              up ? "Technical Climb"  : "Technical Descent";
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

    const distanceKm = Math.round((end - start) * 100) / 100;
    const netElevationM = ascent - descent;
    const distanceM = distanceKm * 1000;
    const grade =
      distanceM > 0
        ? Math.round((netElevationM / distanceM) * 1000) / 10  // one decimal %
        : 0;

    return {
      distance: distanceKm,
      ascent: Math.round(ascent),
      descent: Math.round(descent),
      grade,
      name: gradeLabel(grade),
    };
  });
}
