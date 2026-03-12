import { useRef, useState, useCallback } from "react";
import { useHikeStore } from "../stores/hikeStore";
import { Divider } from "../design-system";
import { IconAdd, IconCancel, IconConfirm, IconSegments } from "../design-system/icons";
import { SegmentRow } from "./SegmentRow";
import { ElevationProfile } from "./ElevationProfile";
import { GpxSegmentPreview } from "./GpxSegmentPreview";
import { parseGpx } from "../lib/gpx";
import type { DerivedSegment, TrackPoint } from "../lib/gpx";

interface EditSegmentsScreenProps {
  onDone: () => void;
}

export function EditSegmentsScreen({ onDone }: EditSegmentsScreenProps) {
  const segments = useHikeStore((s) => s.segments);
  const addSegment = useHikeStore((s) => s.addSegment);
  const removeSegment = useHikeStore((s) => s.removeSegment);
  const [focusLastAdded, setFocusLastAdded] = useState(false);
  const [gpxPoints, setGpxPoints] = useState<TrackPoint[] | null>(null);
  const [derivedSegments, setDerivedSegments] = useState<DerivedSegment[]>([]);
  const [gpxUploadCount, setGpxUploadCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceSegments = useHikeStore((s) => s.replaceSegments);

  const handleNameChange = useCallback((index: number, name: string) => {
    setDerivedSegments((prev) =>
      prev.map((s, i) => (i === index ? { ...s, name } : s))
    );
  }, []);

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onerror = () => {
      alert("Could not read the file. Please try again.");
    };
    reader.onload = (ev) => {
      const xml = ev.target?.result as string;
      const points = parseGpx(xml);
      if (points.length > 0) {
        setGpxPoints(points);
        setDerivedSegments([]);
        setGpxUploadCount((n) => n + 1);
      } else {
        alert("No track points found. Make sure the file is a valid GPX with a track.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleConfirmGpx = () => {
    if (derivedSegments.length === 0) return;
    replaceSegments(derivedSegments.map((s) => ({
      name: s.name.trim() || undefined,
      distance: s.distance,
      ascent: s.ascent,
      descent: s.descent,
    })));
    setGpxPoints(null);
    setDerivedSegments([]);
    onDone();
  };

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

        {/* Section header + action buttons in one row */}
        <div className="flex gap-[24px] items-center w-full shrink-0">
          <div className="bg-[#0b0b0b] flex gap-[8px] items-center px-px flex-1 min-w-0">
            <IconSegments className="size-3 shrink-0 invert" />
            <span className="font-['TX-02'] uppercase text-[#f8f8f8] text-[14px] font-normal tracking-[-0.02em] leading-[0.85]">
              Edit Segments
            </span>
          </div>
          <div className="flex gap-[8px] items-center shrink-0">
            <button
              type="button"
              onClick={handleAdd}
              className="bg-[#d9d9d9] flex gap-[4px] items-center justify-center px-[8px] py-[6px] rounded-[4px]"
            >
              <IconAdd className="size-3 shrink-0" />
              <span className="font-['TX-02'] uppercase text-[#0b0b0b] text-[14px] font-normal tracking-[-0.02em] leading-[0.85]">
                Manual
              </span>
            </button>
            {!gpxPoints && (
              <button
                type="button"
                onClick={handleUploadClick}
                className="bg-[#d9d9d9] flex gap-[4px] items-center justify-center px-[8px] py-[6px] rounded-[4px]"
              >
                <IconAdd className="size-3 shrink-0" />
                <span className="font-['TX-02'] uppercase text-[#0b0b0b] text-[14px] font-normal tracking-[-0.02em] leading-[0.85]">
                  Upload
                </span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".gpx"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>

        {/* Manual segment rows — hidden while in GPX import mode */}
        {!gpxPoints && segments.map((segment, index) => (
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

        {/* GPX elevation profile + derived segment list */}
        {gpxPoints && (
          <>
            <ElevationProfile
              key={gpxUploadCount}
              points={gpxPoints}
              onSegmentsChange={(newSegs) => {
                setDerivedSegments((prev) =>
                  newSegs.map((s, i) => ({ ...s, name: prev[i]?.name ?? s.name }))
                );
              }}
            />
            <GpxSegmentPreview
              segments={derivedSegments}
              onNameChange={handleNameChange}
            />
          </>
        )}

        <Divider />

        {/* Bottom action row — Cancel always visible, Done only in GPX mode */}
        <div className="flex gap-[16px] items-center justify-end w-full shrink-0">
          <button
            type="button"
            onClick={onDone}
            className="flex gap-[4px] items-center justify-center"
          >
            <IconCancel className="size-3 shrink-0" />
            <span className="font-['TX-02'] uppercase text-[#0b0b0b] text-[14px] font-normal tracking-[-0.02em] leading-[0.85]">
              Cancel
            </span>
          </button>
          {gpxPoints && (
            <button
              type="button"
              onClick={handleConfirmGpx}
              className="bg-[#f86d23] flex gap-[4px] items-center justify-center px-[8px] py-[6px] rounded-[4px]"
            >
              <IconConfirm className="size-3 shrink-0" />
              <span className="font-['TX-02'] uppercase text-[#0b0b0b] text-[14px] font-normal tracking-[-0.02em] leading-[0.85]">
                Done
              </span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
