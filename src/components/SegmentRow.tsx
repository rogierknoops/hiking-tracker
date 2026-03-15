import { useEffect, useRef, useState } from "react";
import { useHikeStore } from "../stores/hikeStore";
import type { Segment } from "../types";

const tx02 =
  "font-['TX-02'] text-[14px] uppercase tracking-[-0.02em] leading-[0.85] text-[#0b0b0b]";

const labelClass = `${tx02} font-bold shrink-0 w-[78px]`;

interface SegmentRowProps {
  segment: Segment;
  index: number;
  autoFocusName?: boolean;
  onAutoFocusDone?: () => void;
  onRemove: () => void;
}

/**
 * Auto-sizing numeric input with a fixed unit suffix.
 * Uses the HTML size attribute (character count) to size the input to its content.
 * TX-02 is monospace so size in characters maps precisely to rendered width.
 */
function UnitInput({
  value,
  unit,
  inputMode,
  step,
  onChange,
}: {
  value: number | "";
  unit: string;
  inputMode: "numeric" | "decimal";
  step?: string;
  onChange: (raw: string) => void;
}) {
  const externalStr = value === "" ? "" : String(value);
  const [localValue, setLocalValue] = useState(externalStr);

  // Sync from external value unless the user is mid-decimal entry (e.g. "5." or "5,")
  useEffect(() => {
    if (!localValue.endsWith(".") && !localValue.endsWith(",")) {
      setLocalValue(externalStr);
    }
  }, [externalStr]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex items-baseline">
      <input
        type="text"
        inputMode={inputMode}
        step={step}
        value={localValue}
        onChange={(e) => {
          setLocalValue(e.target.value);
          onChange(e.target.value);
        }}
        placeholder="-"
        style={{ width: "60px" }}
        className={`${tx02} bg-transparent border-none outline-none placeholder-[#0b0b0b]/40`}
      />
      <span className={tx02}>{unit}</span>
    </div>
  );
}

export function SegmentRow({
  segment,
  index,
  autoFocusName = false,
  onAutoFocusDone,
  onRemove,
}: SegmentRowProps) {
  const updateSegment = useHikeStore((s) => s.updateSegment);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocusName) {
      nameRef.current?.focus();
      onAutoFocusDone?.();
    }
  }, [autoFocusName, onAutoFocusDone]);

  return (
    <div className="flex flex-col gap-[24px] w-full">
      {/* Segment title row */}
      <div className="flex items-center justify-between w-full">
        <div className="flex gap-[8px] items-center min-w-0 flex-1">
          <span className={`${tx02} font-bold shrink-0 w-[12px]`}>{index}</span>
          <input
            ref={nameRef}
            type="text"
            value={segment.name ?? ""}
            onChange={(e) => updateSegment(segment.id, { name: e.target.value })}
            placeholder=""
            className={`${tx02} font-bold bg-transparent border-none outline-none min-w-0 flex-1`}
          />
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="border border-[#0b0b0b] flex items-center justify-center px-[8px] py-[6px] rounded-[4px] shrink-0 ml-2"
        >
          <span className={tx02}>Remove</span>
        </button>
      </div>

      {/* Details container */}
      <div className="flex flex-col gap-[16px]">
        {/* Distance */}
        <div className="flex gap-[16px] items-baseline">
          <span className={labelClass}>Distance</span>
          <UnitInput
            value={segment.distance === 0 ? "" : segment.distance}
            unit=" KM"
            inputMode="decimal"
            step="0.1"
            onChange={(raw) =>
              updateSegment(segment.id, { distance: parseFloat(raw) || 0 })
            }
          />
        </div>

        {/* Ascent */}
        <div className="flex gap-[16px] items-baseline">
          <span className={labelClass}>Ascent</span>
          <UnitInput
            value={segment.ascent === 0 ? "" : segment.ascent}
            unit=" M"
            inputMode="numeric"
            step="1"
            onChange={(raw) =>
              updateSegment(segment.id, { ascent: parseFloat(raw) || 0 })
            }
          />
        </div>

        {/* Descent */}
        <div className="flex gap-[16px] items-baseline">
          <span className={labelClass}>Descent</span>
          <UnitInput
            value={segment.descent === 0 ? "" : segment.descent}
            unit=" M"
            inputMode="numeric"
            step="1"
            onChange={(raw) =>
              updateSegment(segment.id, { descent: parseFloat(raw) || 0 })
            }
          />
        </div>
      </div>
    </div>
  );
}
