import { useState } from "react";
import { useHikeStore } from "../stores/hikeStore";
import { Button } from "../design-system";

interface SegmentFormProps {
  onSaved?: () => void;
}

export function SegmentForm({ onSaved }: SegmentFormProps = {}) {
  const addSegment = useHikeStore((s) => s.addSegment);
  const [name, setName] = useState("");
  const [distance, setDistance] = useState("");
  const [ascent, setAscent] = useState("");
  const [descent, setDescent] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const d = parseFloat(distance);
    const a = parseFloat(ascent);
    const desc = parseFloat(descent);
    if (isNaN(d) || isNaN(a) || isNaN(desc) || d < 0 || a < 0 || desc < 0) return;
    addSegment({
      name: name.trim() || undefined,
      distance: d,
      ascent: a,
      descent: desc,
    });
    setName("");
    setDistance("");
    setAscent("");
    setDescent("");
    onSaved?.();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end">
      <label className="flex flex-col gap-1">
        <span className="text-[length:var(--ds-font-size)] text-[var(--ds-black)]/70">Name (optional)</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Segment 1"
          className="border border-[var(--ds-black)]/20 bg-[var(--ds-background)] px-3 py-2 text-[length:var(--ds-font-size)] text-[var(--ds-black)]"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[length:var(--ds-font-size)] text-[var(--ds-black)]/70">Distance (km)</span>
        <input
          type="number"
          step="0.1"
          min="0"
          value={distance}
          onChange={(e) => setDistance(e.target.value)}
          required
          className="border border-[var(--ds-black)]/20 bg-[var(--ds-background)] px-3 py-2 text-[length:var(--ds-font-size)] w-24 text-[var(--ds-black)]"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[length:var(--ds-font-size)] text-[var(--ds-black)]/70">Ascent (m)</span>
        <input
          type="number"
          step="1"
          min="0"
          value={ascent}
          onChange={(e) => setAscent(e.target.value)}
          required
          className="border border-[var(--ds-black)]/20 bg-[var(--ds-background)] px-3 py-2 text-[length:var(--ds-font-size)] w-24 text-[var(--ds-black)]"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[length:var(--ds-font-size)] text-[var(--ds-black)]/70">Descent (m)</span>
        <input
          type="number"
          step="1"
          min="0"
          value={descent}
          onChange={(e) => setDescent(e.target.value)}
          required
          className="border border-[var(--ds-black)]/20 bg-[var(--ds-background)] px-3 py-2 text-[length:var(--ds-font-size)] w-24 text-[var(--ds-black)]"
        />
      </label>
      <Button type="submit" variant="Primary" icon="add">
        Add segment
      </Button>
    </form>
  );
}
