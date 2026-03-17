export interface TrackPoint {
  distance: number; // cumulative km from start
  elevation: number; // metres
}

export interface Segment {
  id: string;
  name?: string;
  distance: number; // km
  ascent: number; // m
  descent: number; // m
  plannedDuration?: number; // minutes (computed from formula)
  actualArrivalTime?: string; // ISO timestamp when user arrived
}

export interface HikeSession {
  id: string;
  name: string;
  segments: Segment[];
  departureTime: string; // ISO timestamp
  departureLogged: boolean; // true once user explicitly taps LOG
  durationFormula: string; // user-provided formula expression
  /** GPX track points for the day — persisted so the elevation profile survives re-opens. */
  gpxPoints?: TrackPoint[];
  /** Original GPX filename (without extension). */
  gpxFilename?: string;
}

/** Top-level persisted data envelope — supports multiple days. */
export interface HikeData {
  days: HikeSession[];
  currentDayIndex: number;
}
