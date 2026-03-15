import type { Segment } from "../types";

/**
 * Add minutes to an ISO timestamp and return new ISO string.
 */
export function addMinutes(isoDate: string, minutes: number): string {
  const d = new Date(isoDate);
  d.setMinutes(d.getMinutes() + minutes);
  return d.toISOString();
}

/**
 * Get expected arrival time at segment index, given departure and cumulative planned durations.
 */
export function getExpectedArrivalAtSegment(
  departureTime: string,
  segments: Segment[],
  segmentIndex: number
): string {
  let cumulativeMinutes = 0;
  for (let i = 0; i <= segmentIndex && i < segments.length; i++) {
    cumulativeMinutes += segments[i].plannedDuration ?? 0;
  }
  return addMinutes(departureTime, cumulativeMinutes);
}

/**
 * Get expected end time for the full trail.
 */
export function getExpectedEndTime(
  departureTime: string,
  segments: Segment[]
): string {
  const totalMinutes = segments.reduce(
    (sum, s) => sum + (s.plannedDuration ?? 0),
    0
  );
  return addMinutes(departureTime, totalMinutes);
}

/**
 * Compute margin in minutes: positive = shorter than planned (ahead), negative = longer than planned (behind).
 * expectedArrival - actualArrival = margin
 */
export function getSegmentMargin(
  actualArrival: string,
  expectedArrival: string
): number {
  const actual = new Date(actualArrival).getTime();
  const expected = new Date(expectedArrival).getTime();
  return Math.round((expected - actual) / 60000);
}

/**
 * Format margin as "+12 min" or "-5 min".
 */
export function formatMargin(minutes: number): string {
  const sign = minutes >= 0 ? "+" : "";
  return `${sign}${minutes} min`;
}
