import { useState } from "react";
import { useHikeStore } from "../stores/hikeStore";
import { IconAdd, IconCancel, IconConfirm, IconEdit } from "../design-system/icons";
import { haptics } from "../lib/haptics";

// Shared text style (applied to the inner <p> or <input>)
const tx02Text = "font-['TX-02'] text-[14px] uppercase tracking-[-0.02em] leading-[0.85] whitespace-nowrap";
// Figma wrapper pattern: collapses outer line-height so text sits on the correct baseline
const tx02Wrap = "flex flex-col justify-end leading-[0] shrink-0";
// Same pattern but flex-grows and clips overflow (for truncating route names)
const tx02WrapGrow = "flex flex-[1_0_0] flex-col justify-end leading-[0] min-w-0 overflow-hidden";

interface DaySwitchOverlayProps {
  onClose: () => void;
}

/**
 * Full-screen overlay for switching between days (default) or editing them
 * (renaming, adding, removing).
 */
export function DaySwitchOverlay({ onClose }: DaySwitchOverlayProps) {
  const days = useHikeStore((s) => s.days);
  const currentDayIndex = useHikeStore((s) => s.currentDayIndex);
  const currentName = useHikeStore((s) => s.name);
  const switchDay = useHikeStore((s) => s.switchDay);
  const addDay = useHikeStore((s) => s.addDay);
  const removeDay = useHikeStore((s) => s.removeDay);
  const updateDayName = useHikeStore((s) => s.updateDayName);

  const [isEditMode, setIsEditMode] = useState(false);

  // Merge the live current-day name (top-level state) into the days array
  // so the overlay always shows the most up-to-date value.
  const displayDays = days.map((d, i) =>
    i === currentDayIndex ? { ...d, name: currentName } : d
  );

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ maxWidth: 390, margin: "0 auto" }}
    >
      {/* ── Panel ── */}
      <div className="bg-[#f8f8f8] border-b border-[#0b0b0b] flex flex-col gap-[40px] items-start px-[16px] py-[80px] shrink-0">

        {/* Title row: "SWITCH DAYS" + × close */}
        <div className="flex items-start justify-between w-full">
          <span className={`${tx02Text} font-bold text-[#0b0b0b]`}>Switch Days</span>
          <button
            type="button"
            onClick={() => { haptics.light(); onClose(); }}
            className="hover:opacity-70"
            aria-label="Close"
          >
            <IconCancel className="size-3 shrink-0" />
          </button>
        </div>

        {/* Day rows + action buttons */}
        <div className="flex flex-col gap-[40px] items-start w-full">

          {displayDays.map((d, index) => {
            const isActive = index === currentDayIndex;
            const pillBg = isActive ? "bg-[#0b0b0b]" : "bg-[#d9d9d9]";
            const pillText = isActive ? "text-[#f8f8f8]" : "text-[#0b0b0b]";

            // Shared pill element (same in both modes)
            const pill = (
              <div className={`${pillBg} flex items-center px-px shrink-0`}>
                <div className={tx02Wrap}>
                  <p className={`${tx02Text} ${pillText}`}>Day {index + 1}</p>
                </div>
              </div>
            );

            if (isEditMode) {
              return (
                /* Edit mode: [pill + name flex-grows]   × pinned right */
                <div key={d.id} className="flex gap-[16px] items-center w-full">
                  <div className="flex flex-[1_0_0] gap-[8px] items-start min-w-0">
                    {pill}
                    <div className={tx02WrapGrow}>
                      <div className="flex leading-[0.85]">
                        <span className={`${tx02Text} text-[#8c8c8c] shrink-0`}>/&nbsp;</span>
                        <input
                          type="text"
                          value={d.name}
                          onChange={(e) => updateDayName(index, e.target.value)}
                          className={`${tx02Text} text-[#8c8c8c] bg-transparent border-none outline-none min-w-0 flex-1 overflow-hidden`}
                          style={{ fontSize: 16, transform: "scale(0.875)", transformOrigin: "left center" }}
                          aria-label={`Rename Day ${index + 1}`}
                        />
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { haptics.heavy(); removeDay(index); }}
                    disabled={days.length <= 1}
                    className="shrink-0"
                    aria-label={`Remove Day ${index + 1}`}
                  >
                    <IconCancel className="size-3 shrink-0" />
                  </button>
                </div>
              );
            }

            return (
              /* Switch mode: [pill + name flex-grows], full-width row */
              <button
                key={d.id}
                type="button"
                onClick={() => { haptics.medium(); switchDay(index); onClose(); }}
                className="flex gap-[8px] items-start w-full hover:opacity-80"
              >
                {pill}
                <div className={tx02WrapGrow}>
                  <p className={`${tx02Text} text-left text-[#8c8c8c] overflow-hidden text-ellipsis`}>/ {d.name}</p>
                </div>
              </button>
            );
          })}

          {/* Action buttons */}
          {isEditMode ? (
            /* Edit mode: + ADD   ✓ DONE */
            <div className="flex gap-[40px] items-start justify-start w-full shrink-0">
              <button
                type="button"
                onClick={() => { haptics.medium(); addDay(); }}
                className="flex gap-[4px] items-center justify-center hover:opacity-70"
              >
                <IconAdd className="size-3 shrink-0" />
                <span className={`${tx02Text} text-[#0b0b0b]`}>Add</span>
              </button>
              <button
                type="button"
                onClick={() => { haptics.light(); setIsEditMode(false); }}
                className="flex gap-[4px] items-center justify-center hover:opacity-70"
              >
                <IconConfirm className="size-3 shrink-0" />
                <span className={`${tx02Text} text-[#0b0b0b]`}>Done</span>
              </button>
            </div>
          ) : (
            /* Switch mode: ✎ EDIT */
            <div className="flex flex-col items-start w-full shrink-0">
              <button
                type="button"
                onClick={() => { haptics.light(); setIsEditMode(true); }}
                className="flex gap-[4px] items-center justify-center hover:opacity-70"
              >
                <IconEdit className="size-3 shrink-0" />
                <span className={`${tx02Text} text-[#0b0b0b]`}>Edit</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Backdrop — tap to close ── */}
      <div
        className="flex-1 bg-[rgba(0,0,0,0.2)]"
        onClick={() => { haptics.light(); onClose(); }}
        aria-label="Close day switcher"
      />
    </div>
  );
}
