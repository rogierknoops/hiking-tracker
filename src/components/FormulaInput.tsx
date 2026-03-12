import { useHikeStore } from "../stores/hikeStore";
import { DEFAULT_FORMULA } from "../lib/formula";

export function FormulaInput() {
  const durationFormula = useHikeStore((s) => s.durationFormula);
  const setDurationFormula = useHikeStore((s) => s.setDurationFormula);
  const segments = useHikeStore((s) => s.segments);

  const totalPlanned = segments.reduce(
    (sum, s) => sum + (s.plannedDuration ?? 0),
    0
  );
  const hours = Math.floor(totalPlanned / 60);
  const mins = totalPlanned % 60;

  return (
    <div className="space-y-2">
      <label className="block">
        <span className="text-[length:var(--ds-font-size)] text-[var(--ds-black)]/70">
          Duration formula (d = km, a = ascent m, descent = descent m). Result in hours.
        </span>
        <input
          type="text"
          value={durationFormula}
          onChange={(e) => setDurationFormula(e.target.value)}
          placeholder={DEFAULT_FORMULA}
          className="mt-1 block w-full border border-[var(--ds-black)]/20 bg-[var(--ds-background)] px-3 py-2 text-[length:var(--ds-font-size)] font-mono text-[var(--ds-black)]"
        />
      </label>
      <p className="text-[length:var(--ds-font-size)] text-[var(--ds-black)]/70">
        Total planned: {hours}h {mins}m
      </p>
    </div>
  );
}
