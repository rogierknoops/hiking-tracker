import type { DerivedSegment } from "../lib/gpx";

interface GpxSegmentPreviewProps {
  segments: DerivedSegment[];
  onNameChange: (index: number, name: string) => void;
}

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
        <div key={i} className="flex flex-col gap-[8px]">
          <div className="flex items-center gap-[8px]">
            <span className="font-['TX-02'] text-[#0b0b0b] text-[14px] font-bold uppercase tracking-[-0.02em] leading-[0.85]">
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
          <div className="flex flex-col gap-[4px] pl-[20px]">
            <div className="flex gap-[16px]">
              <span className="font-['TX-02'] text-[#0b0b0b] text-[12px] uppercase tracking-[-0.02em] opacity-50 w-[64px]">DISTANCE</span>
              <span className="font-['TX-02'] text-[#0b0b0b] text-[12px] uppercase tracking-[-0.02em]">{seg.distance.toFixed(2)}KM</span>
            </div>
            <div className="flex gap-[16px]">
              <span className="font-['TX-02'] text-[#0b0b0b] text-[12px] uppercase tracking-[-0.02em] opacity-50 w-[64px]">ASCENT</span>
              <span className="font-['TX-02'] text-[#0b0b0b] text-[12px] uppercase tracking-[-0.02em]">+{seg.ascent}M</span>
            </div>
            <div className="flex gap-[16px]">
              <span className="font-['TX-02'] text-[#0b0b0b] text-[12px] uppercase tracking-[-0.02em] opacity-50 w-[64px]">DESCENT</span>
              <span className="font-['TX-02'] text-[#0b0b0b] text-[12px] uppercase tracking-[-0.02em]">-{seg.descent}M</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
