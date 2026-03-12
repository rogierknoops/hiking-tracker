import { useHikeStore } from "../stores/hikeStore";
import { getExpectedEndTime } from "../lib/calculations";
import { Button } from "../design-system";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function DeparturePicker() {
  const departureTime = useHikeStore((s) => s.departureTime);
  const setDepartureTime = useHikeStore((s) => s.setDepartureTime);
  const segments = useHikeStore((s) => s.segments);

  const expectedEnd = getExpectedEndTime(departureTime, segments);

  const handleNow = () => {
    setDepartureTime(new Date().toISOString());
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val) {
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        setDepartureTime(d.toISOString());
      }
    }
  };

  const localInput = (() => {
    const d = new Date(departureTime);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  })();

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2">
          <span className="text-[length:var(--ds-font-size)] text-[var(--ds-black)]/70">Departure:</span>
          <input
            type="datetime-local"
            value={localInput}
            onChange={handleChange}
            className="border border-[var(--ds-black)]/20 bg-[var(--ds-background)] px-3 py-2 text-[length:var(--ds-font-size)] text-[var(--ds-black)]"
          />
        </label>
        <Button onClick={handleNow} variant="Primary">
          Start now
        </Button>
      </div>
      <p className="text-[length:var(--ds-font-size)] text-[var(--ds-black)]/70">
        Expected end: {formatDateTime(expectedEnd)}
      </p>
    </div>
  );
}
