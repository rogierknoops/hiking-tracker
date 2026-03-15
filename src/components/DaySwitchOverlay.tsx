import { useState } from "react";
import { useHikeStore } from "../stores/hikeStore";
import { IconAdd, IconCancel, IconConfirm, IconEdit } from "../design-system/icons";

const tx02 = "font-['TX-02'] text-[14px] uppercase tracking-[-0.02em] leading-[0.85]";

interface DaySwitchOverlayProps {
  onClose: () => void;
}

/**
 * A single day row in edit mode.
 * Normal:  [DAY N pill] [×]
 * Pending: [DELETE DAY N?] [✓] [×]
 */
function EditDayRow({
  label,
  onRemove,
  canRemove,
}: {
  label: string;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const [isPendingDelete, setIsPendingDelete] = useState(false);

  if (isPendingDelete) {
    return (
      <div className="flex gap-[16px] items-center justify-end shrink-0 w-[169.5px]">
        <div className="flex items-center px-px shrink-0">
          <span className={`${tx02} text-[#0b0b0b]`}>Delete {label}?</span>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="hover:opacity-70"
          aria-label={`Confirm delete ${label}`}
        >
          <IconConfirm className="size-3 shrink-0" />
        </button>
        <button
          type="button"
          onClick={() => setIsPendingDelete(false)}
          className="hover:opacity-70"
          aria-label="Cancel delete"
        >
          <IconCancel className="size-3 shrink-0" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-[16px] items-center justify-end shrink-0 w-[169.5px]">
      <div className="bg-[#0b0b0b] flex items-center px-px shrink-0">
        <span className={`${tx02} text-[#f8f8f8]`}>{label}</span>
      </div>
      <button
        type="button"
        onClick={() => canRemove && setIsPendingDelete(true)}
        disabled={!canRemove}
        className={canRemove ? "hover:opacity-70" : "opacity-30 cursor-not-allowed"}
        aria-label={`Remove ${label}`}
      >
        <IconCancel className="size-3 shrink-0" />
      </button>
    </div>
  );
}

export function DaySwitchOverlay({ onClose }: DaySwitchOverlayProps) {
  const days = useHikeStore((s) => s.days);
  const currentDayIndex = useHikeStore((s) => s.currentDayIndex);
  const switchDay = useHikeStore((s) => s.switchDay);
  const addDay = useHikeStore((s) => s.addDay);
  const removeDay = useHikeStore((s) => s.removeDay);

  const [isEditMode, setIsEditMode] = useState(false);

  function handleSwitchDay(index: number) {
    switchDay(index);
    onClose();
  }

  function handleRemoveDay(index: number) {
    removeDay(index);
    // If only 1 day would remain after this, exit edit mode automatically
    if (days.length - 1 <= 1) setIsEditMode(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ maxWidth: 390, margin: "0 auto" }}
    >
      {/* ── Panel ── */}
      <div className="bg-[#f8f8f8] border-b border-[#0b0b0b] flex flex-col gap-[40px] items-end w-full px-[16px] py-[80px] shrink-0">

        {isEditMode ? (
          /* ━━━━ EDIT MODE ━━━━ */
          <>
            {/* Title row: "EDIT DAYS" left, current day pill + × right */}
            <div className="flex items-start justify-between w-full">
              <span className={`${tx02} text-[#0b0b0b] font-bold`}>Edit Days</span>
              <EditDayRow
                label={`Day ${currentDayIndex + 1}`}
                onRemove={() => handleRemoveDay(currentDayIndex)}
                canRemove={days.length > 1}
              />
            </div>

            {/* All other days */}
            {days.map((_, index) =>
              index !== currentDayIndex ? (
                <EditDayRow
                  key={index}
                  label={`Day ${index + 1}`}
                  onRemove={() => handleRemoveDay(index)}
                  canRemove={days.length > 1}
                />
              ) : null
            )}

            {/* + ADD  ✓ DONE */}
            <div className="flex gap-[40px] items-start justify-end shrink-0">
              <button
                type="button"
                onClick={() => addDay()}
                className="flex gap-[4px] items-center justify-center hover:opacity-70"
              >
                <IconAdd className="size-3 shrink-0" />
                <span className={`${tx02} text-[#0b0b0b]`}>Add</span>
              </button>
              <button
                type="button"
                onClick={() => setIsEditMode(false)}
                className="flex gap-[4px] items-center justify-center hover:opacity-70"
              >
                <IconConfirm className="size-3 shrink-0" />
                <span className={`${tx02} text-[#0b0b0b]`}>Done</span>
              </button>
            </div>
          </>
        ) : (
          /* ━━━━ SWITCH MODE ━━━━ */
          <>
            {/* Title row: "SWITCH DAYS" left, current day pill right (tappable to close) */}
            <div className="flex items-start justify-between w-full">
              <span className={`${tx02} text-[#0b0b0b] font-bold`}>Switch Days</span>
              <button
                type="button"
                onClick={onClose}
                className="bg-[#0b0b0b] flex items-center px-px shrink-0 hover:opacity-80"
              >
                <span className={`${tx02} text-[#f8f8f8]`}>Day {currentDayIndex + 1}</span>
              </button>
            </div>

            {/* Other days as tappable switcher pills */}
            {days.map((_, index) =>
              index !== currentDayIndex ? (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSwitchDay(index)}
                  className="bg-[#0b0b0b] flex items-center px-px hover:opacity-80 shrink-0"
                >
                  <span className={`${tx02} text-[#f8f8f8]`}>Day {index + 1}</span>
                </button>
              ) : null
            )}

            {/* ↑ EDIT button */}
            <div className="flex flex-col items-end shrink-0">
              <button
                type="button"
                onClick={() => setIsEditMode(true)}
                className="flex gap-[4px] items-center justify-center hover:opacity-70"
              >
                <IconEdit className="size-3 shrink-0" />
                <span className={`${tx02} text-[#0b0b0b]`}>Edit</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── Backdrop — tap to close ── */}
      <div
        className="flex-1 bg-[rgba(0,0,0,0.2)]"
        onClick={onClose}
        aria-label="Close day switcher"
      />
    </div>
  );
}
