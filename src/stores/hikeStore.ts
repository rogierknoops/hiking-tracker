import { create } from "zustand";
import type { HikeSession, Segment } from "../types";
import { evaluateDuration, DEFAULT_FORMULA } from "../lib/formula";
import { loadData, saveData } from "../lib/storage";

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch {
      // Falls through to manual generation (non-secure context, e.g. HTTP on LAN)
    }
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function makeEmptySession(formula: string): HikeSession {
  return {
    id: generateId(),
    name: "My Hike",
    segments: [],
    departureTime: new Date().toISOString(),
    departureLogged: false,
    durationFormula: formula,
  };
}

const day1 = makeEmptySession(DEFAULT_FORMULA);

interface HikeState extends HikeSession {
  /** All days in this hike trip. */
  days: HikeSession[];
  /** Which day is currently active (0-based). */
  currentDayIndex: number;

  addSegment: (segment: Omit<Segment, "id" | "plannedDuration">) => void;
  updateSegment: (id: string, updates: Partial<Segment>) => void;
  removeSegment: (id: string) => void;
  replaceSegments: (segments: Omit<Segment, "id" | "plannedDuration">[]) => void;
  reorderSegments: (fromIndex: number, toIndex: number) => void;
  setDepartureTime: (iso: string) => void;
  setDurationFormula: (formula: string) => void;
  setSessionName: (name: string) => void;
  logArrival: (segmentId: string, iso?: string) => void;
  recalculatePlannedDurations: () => void;
  /** Switch to a different day, saving the current day first. */
  switchDay: (index: number) => void;
  /** Add a new empty day and switch to it. */
  addDay: () => void;
  /** Remove a day by index. Switches to an adjacent day if needed. No-op when only 1 day remains. */
  removeDay: (index: number) => void;
  /** Rename any day by index (current or other). */
  updateDayName: (index: number, name: string) => void;
  load: () => void;
  persist: () => void;
  reset: () => void;
}

function computePlannedDurations(segments: Segment[], formula: string): Segment[] {
  return segments.map((s) => ({
    ...s,
    plannedDuration: evaluateDuration(formula, s.distance, s.ascent, s.descent),
  }));
}

/** Extract the current day's session from the spread state. */
function currentDaySnapshot(state: HikeState): HikeSession {
  return {
    id: state.id,
    name: state.name,
    segments: state.segments,
    departureTime: state.departureTime,
    departureLogged: state.departureLogged,
    durationFormula: state.durationFormula,
  };
}

export const useHikeStore = create<HikeState>((set, get) => ({
  ...day1,
  days: [day1],
  currentDayIndex: 0,

  addSegment: (segment) => {
    const { segments, durationFormula } = get();
    const newSegment: Segment = {
      ...segment,
      id: generateId(),
      plannedDuration: evaluateDuration(durationFormula, segment.distance, segment.ascent, segment.descent),
    };
    set({ segments: [...segments, newSegment] });
    get().persist();
  },

  updateSegment: (id, updates) => {
    const { segments, durationFormula } = get();
    const next = segments.map((s) => (s.id === id ? { ...s, ...updates } : s));
    set({ segments: computePlannedDurations(next, durationFormula) });
    get().persist();
  },

  removeSegment: (id) => {
    set({ segments: get().segments.filter((s) => s.id !== id) });
    get().persist();
  },

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

  reorderSegments: (fromIndex, toIndex) => {
    const copy = [...get().segments];
    const [removed] = copy.splice(fromIndex, 1);
    copy.splice(toIndex, 0, removed);
    set({ segments: copy });
    get().persist();
  },

  setDepartureTime: (iso) => {
    set({ departureTime: iso, departureLogged: true });
    get().persist();
  },

  setDurationFormula: (formula) => {
    set({ durationFormula: formula });
    get().recalculatePlannedDurations();
  },

  setSessionName: (name) => {
    set({ name });
    get().persist();
  },

  logArrival: (segmentId, iso) => {
    const time = iso ?? new Date().toISOString();
    get().updateSegment(segmentId, { actualArrivalTime: time });
  },

  recalculatePlannedDurations: () => {
    const { segments, durationFormula } = get();
    set({ segments: computePlannedDurations(segments, durationFormula) });
    get().persist();
  },

  switchDay: (index: number) => {
    const state = get();
    if (index === state.currentDayIndex) return;
    // Save current day into the days array
    const updatedDays = [...state.days];
    updatedDays[state.currentDayIndex] = currentDaySnapshot(state);
    // Spread new day's fields at top level
    const newDay = updatedDays[index];
    set({ ...newDay, days: updatedDays, currentDayIndex: index });
    get().persist();
  },

  addDay: () => {
    const state = get();
    // Save current day
    const updatedDays = [...state.days];
    updatedDays[state.currentDayIndex] = currentDaySnapshot(state);
    // New empty day inherits the formula
    const newDay = makeEmptySession(state.durationFormula);
    const allDays = [...updatedDays, newDay];
    set({ ...newDay, days: allDays, currentDayIndex: allDays.length - 1 });
    get().persist();
  },

  updateDayName: (index: number, name: string) => {
    const state = get();
    if (index === state.currentDayIndex) {
      set({ name });
    } else {
      const updatedDays = [...state.days];
      updatedDays[index] = { ...updatedDays[index], name };
      set({ days: updatedDays });
    }
    get().persist();
  },

  removeDay: (index: number) => {
    const state = get();
    if (state.days.length <= 1) return; // Can't remove last day

    // Snapshot current day before mutating
    const updatedDays = [...state.days];
    updatedDays[state.currentDayIndex] = currentDaySnapshot(state);

    const filtered = updatedDays.filter((_, i) => i !== index);

    // Determine new active index after removal
    let newIndex = state.currentDayIndex;
    if (index < state.currentDayIndex) {
      newIndex = state.currentDayIndex - 1;
    } else if (index === state.currentDayIndex) {
      newIndex = Math.max(0, index - 1);
    }

    set({ ...filtered[newIndex], days: filtered, currentDayIndex: newIndex });
    get().persist();
  },

  load: () => {
    const data = loadData();
    if (data && data.days.length > 0) {
      const idx = data.currentDayIndex ?? 0;
      const current = data.days[idx] ?? data.days[0];
      set({ ...current, days: data.days, currentDayIndex: idx });
    }
  },

  persist: () => {
    const state = get();
    const updatedDays = [...state.days];
    updatedDays[state.currentDayIndex] = currentDaySnapshot(state);
    saveData({ days: updatedDays, currentDayIndex: state.currentDayIndex });
  },

  reset: () => {
    const fresh = makeEmptySession(DEFAULT_FORMULA);
    set({ ...fresh, days: [fresh], currentDayIndex: 0 });
    get().persist();
  },
}));
