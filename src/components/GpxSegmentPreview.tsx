import { Fragment } from "react";
import { Divider } from "../design-system";
import type { DerivedSegment } from "../lib/gpx";

interface GpxSegmentPreviewProps {
  segments: DerivedSegment[];
  onNameChange: (index: number, name: string) => void;
}

const labelClass =
  "font-['TX-02'] text-[#0b0b0b] text-[14px] font-normal uppercase tracking-[-0.02em] leading-[0.85] w-[78px] shrink-0";
const valueClass =
  "font-['TX-02'] text-[#0b0b0b] text-[14px] font-normal uppercase tracking-[-0.02em] leading-[0.85] whitespace-nowrap";

export function GpxSegmentPreview({ segments, onNameChange }: GpxSegmentPreviewProps) {
  if (segments.length === 0) {
    return (
      <div className="flex items-center gap-[8px]">
        <div className="bg-[#d9d9d9] rounded-[2px] size-[12px] shrink-0" />
        <div className="bg-[#d9d9d9] h-[12px] rounded-[2px] shrink-0 w-[80px]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[24px]">
      {segments.map((seg, i) => (
        <Fragment key={i}>
          {i > 0 && <Divider length="Short" />}
          <div className="flex flex-col gap-[24px]">
            {/* Segment number + editable name on same row */}
            <div className="flex gap-[8px] items-center">
              <span className="font-['TX-02'] text-[#0b0b0b] text-[14px] font-bold uppercase tracking-[-0.02em] leading-[0.85] w-[12px] shrink-0">
                {i + 1}
              </span>
              <input
                type="text"
                placeholder="SEGMENT NAME"
                value={seg.name}
                onChange={(e) => onNameChange(i, e.target.value)}
                aria-label={`Segment ${i + 1} name`}
                className="font-['TX-02'] text-[#0b0b0b] text-[14px] font-bold uppercase tracking-[-0.02em] leading-[0.85] bg-transparent border-none outline-none placeholder-[#d9d9d9] w-full"
              />
            </div>
            {/* Stats */}
            <div className="flex flex-col gap-[8px]">
              <div className="flex gap-[16px] items-start">
                <span className={labelClass}>DISTANCE</span>
                <span className={valueClass}>{seg.distance.toFixed(2)} KM</span>
              </div>
              <div className="flex gap-[16px] items-start">
                <span className={labelClass}>ASCENT</span>
                <span className={valueClass}>+{seg.ascent} M</span>
              </div>
              <div className="flex gap-[16px] items-start">
                <span className={labelClass}>DESCENT</span>
                <span className={valueClass}>-{seg.descent} M</span>
              </div>
            </div>
          </div>
        </Fragment>
      ))}
    </div>
  );
}
