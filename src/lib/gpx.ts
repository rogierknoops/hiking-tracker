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
