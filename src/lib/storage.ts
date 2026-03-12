import type { HikeData, HikeSession } from "../types";

const KEY_V2 = "hiking-tracker-v2";
const KEY_V1 = "hiking-tracker-session"; // legacy single-session key

export function loadData(): HikeData | null {
  try {
    const raw = localStorage.getItem(KEY_V2);
    if (raw) return JSON.parse(raw) as HikeData;

    // Migrate from legacy single-session format
    const legacy = localStorage.getItem(KEY_V1);
    if (legacy) {
      const session = JSON.parse(legacy) as HikeSession;
      return { days: [session], currentDayIndex: 0 };
    }

    return null;
  } catch {
    return null;
  }
}

export function saveData(data: HikeData): void {
  try {
    localStorage.setItem(KEY_V2, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save data:", e);
  }
}

// Legacy helpers kept for any remaining direct callers
export function loadSession(): HikeSession | null {
  const data = loadData();
  if (!data) return null;
  return data.days[data.currentDayIndex] ?? data.days[0] ?? null;
}

export function saveSession(session: HikeSession): void {
  const existing = loadData();
  const days = existing?.days ? [...existing.days] : [session];
  const idx = existing?.currentDayIndex ?? 0;
  days[idx] = session;
  saveData({ days, currentDayIndex: idx });
}

export function exportSession(session: HikeSession): string {
  return JSON.stringify(session, null, 2);
}

export function importSession(json: string): HikeSession | null {
  try {
    return JSON.parse(json) as HikeSession;
  } catch {
    return null;
  }
}
