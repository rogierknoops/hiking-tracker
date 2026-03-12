import { useState } from "react";
import { useHikeStore } from "../stores/hikeStore";
import { Divider } from "../design-system";
import { IconAdd } from "../design-system/icons";
import { IconSegments } from "../design-system/icons";
import { SegmentRow } from "./SegmentRow";

interface EditSegmentsScreenProps {
  onDone: () => void;
}

export function EditSegmentsScreen({ onDone }: EditSegmentsScreenProps) {
  const segments = useHikeStore((s) => s.segments);
  const addSegment = useHikeStore((s) => s.addSegment);
  const removeSegment = useHikeStore((s) => s.removeSegment);
  const [focusLastAdded, setFocusLastAdded] = useState(false);

  const handleAdd = () => {
    addSegment({ distance: 0, ascent: 0, descent: 0 });
    setFocusLastAdded(true);
  };

  return (
    <div
      className="bg-[#f8f8f8] min-h-screen flex flex-col gap-[40px] pb-[40px] pt-[80px] px-[16px]"
      style={{ maxWidth: 390, margin: "0 auto" }}
    >
      {/* Page Title */}
      <div className="flex items-center justify-between w-full shrink-0">
        <span className="font-['TX-02'] uppercase text-[#0b0b0b] text-[14px] font-bold tracking-[-0.02em] leading-[0.85]">
          HIKING PACE PLANNER
        </span>
        <div className="bg-[#0b0b0b] flex items-center px-px">
          <span className="font-['TX-02'] uppercase text-[#f8f8f8] text-[14px] font-normal tracking-[-0.02em] leading-[0.85]">
            Day 1
          </span>
        </div>
      </div>

      {/* Segments Container */}
      <div className="flex flex-col gap-[24px] w-full">

        {/* EDIT SEGMENTS section header */}
        <div className="bg-[#0b0b0b] flex gap-[8px] items-center px-px">
          <IconSegments className="size-3 shrink-0 invert" />
          <span className="font-['TX-02'] uppercase text-[#f8f8f8] text-[14px] font-normal tracking-[-0.02em] leading-[0.85]">
            Edit Segments
          </span>
        </div>

        {/* Segment rows — each followed by a short divider */}
        {segments.map((segment, index) => (
          <div key={segment.id} className="flex flex-col gap-[24px]">
            <SegmentRow
              segment={segment}
              index={index + 1}
              autoFocusName={focusLastAdded && index === segments.length - 1}
              onAutoFocusDone={() => setFocusLastAdded(false)}
              onRemove={() => removeSegment(segment.id)}
            />
            <Divider length="Short" />
          </div>
        ))}

        {/* ADD button row — skeleton always visible as next-segment placeholder */}
        <div className="flex items-center justify-between w-full">
          <div className="flex gap-[8px] items-center">
            <div className="bg-[#d9d9d9] rounded-[2px] size-[12px] shrink-0" />
            <div className="bg-[#d9d9d9] h-[12px] rounded-[2px] shrink-0 w-[32px]" />
          </div>
          <button
            type="button"
            onClick={handleAdd}
            className="bg-[#d9d9d9] flex gap-[4px] items-center justify-center px-[8px] py-[6px] rounded-[4px] shrink-0"
          >
            <IconAdd className="size-3 shrink-0" />
            <span className="font-['TX-02'] uppercase text-[#0b0b0b] text-[14px] font-normal tracking-[-0.02em] leading-[0.85]">
              Add
            </span>
          </button>
        </div>

        <Divider />

        {/* Done button */}
        <div className="flex items-center justify-end w-full">
          <button
            type="button"
            onClick={onDone}
            className="bg-[#f86d23] flex gap-[4px] items-center justify-center px-[8px] py-[6px] rounded-[4px] shrink-0"
          >
            <IconAdd className="size-3 shrink-0" />
            <span className="font-['TX-02'] uppercase text-[#0b0b0b] text-[14px] font-normal tracking-[-0.02em] leading-[0.85]">
              Done
            </span>
          </button>
        </div>

      </div>
    </div>
  );
}
