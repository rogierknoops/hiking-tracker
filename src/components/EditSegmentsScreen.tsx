import { useRef, useState, useCallback, useMemo } from "react";
import { useHikeStore } from "../stores/hikeStore";
import { Divider } from "../design-system";
import { IconAdd, IconCancel, IconConfirm, IconEdit, IconSegments } from "../design-system/icons";
import { SegmentRow } from "./SegmentRow";
import { ElevationProfile } from "./ElevationProfile";
import { GpxSegmentPreview } from "./GpxSegmentPreview";
import { parseGpx, gradeLabel } from "../lib/gpx";
import { haptics } from "../lib/haptics";
import type { DerivedSegment } from "../lib/gpx";
import type { TrackPoint } from "../types";

type Mode = "upload" | "manual";

interface EditSegmentsScreenProps {
  onDone: () => void;
}

export function EditSegmentsScreen({ onDone }: EditSegmentsScreenProps) {
  const segments = useHikeStore((s) => s.segments);
  const addSegment = useHikeStore((s) => s.addSegment);
  const removeSegment = useHikeStore((s) => s.removeSegment);
  const replaceSegments = useHikeStore((s) => s.replaceSegments);
  const setGpxData = useHikeStore((s) => s.setGpxData);
  const clearGpxData = useHikeStore((s) => s.clearGpxData);
  const storedGpxPoints = useHikeStore((s) => s.gpxPoints);
  const storedGpxFilename = useHikeStore((s) => s.gpxFilename);

  const [mode, setMode] = useState<Mode>("upload");
  const [focusLastAdded, setFocusLastAdded] = useState(false);
  // Initialise from stored GPX data so the profile is visible on re-open.
  const [gpxPoints, setGpxPoints] = useState<TrackPoint[] | null>(
    () => storedGpxPoints ?? null
  );
  const [gpxFilename, setGpxFilename] = useState<string>(
    () => storedGpxFilename ?? ""
  );
  const [derivedSegments, setDerivedSegments] = useState<DerivedSegment[]>([]);
  const [gpxUploadCount, setGpxUploadCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Split positions (cumulative km, excluding 0 and total) derived from the
   * currently stored segments.  Used to pre-populate ElevationProfile markers
   * when restoring a previously-uploaded GPX.
   */
  const initialSplits = useMemo<number[]>(() => {
    if (!storedGpxPoints || segments.length <= 1) return [];
    const splits: number[] = [];
    let cumulative = 0;
    for (let i = 0; i < segments.length - 1; i++) {
      cumulative = Math.round((cumulative + segments[i].distance) * 100) / 100;
      splits.push(cumulative);
    }
    return splits;
    // Only computed once on mount — storedGpxPoints / segments are the initial store values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNameChange = useCallback((index: number, name: string) => {
    setDerivedSegments((prev) =>
      prev.map((s, i) => (i === index ? { ...s, name } : s))
    );
  }, []);

  const handleUploadClick = () => {
    haptics.light();
    fileInputRef.current?.click();
  };

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
        haptics.medium();
        setGpxPoints(points);
        setGpxFilename(file.name.replace(/\.gpx$/i, ""));
        setDerivedSegments([]);
        setGpxUploadCount((n) => n + 1);
      } else {
        haptics.error();
        alert("No track points found. Make sure the file is a valid GPX with a track.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleConfirmGpx = () => {
    if (derivedSegments.length === 0) return;
    haptics.medium();
    replaceSegments(
      derivedSegments.map((s) => ({
        name: s.name.trim() || undefined,
        distance: s.distance,
        ascent: s.ascent,
        descent: s.descent,
      }))
    );
    // Persist GPX points so the elevation profile is available next time.
    if (gpxPoints) {
      setGpxData(gpxPoints, gpxFilename);
    }
    onDone();
  };

  const handleAdd = () => {
    const last = segments[segments.length - 1];
    if (last && !last.name && last.distance === 0 && last.ascent === 0 && last.descent === 0) return;
    haptics.medium();
    addSegment({ distance: 0, ascent: 0, descent: 0 });
    setFocusLastAdded(true);
  };

  const handleSwitchToManual = () => {
    haptics.light();
    setMode("manual");
    // Discard any in-progress GPX import and clear persisted GPX data
    setGpxPoints(null);
    setDerivedSegments([]);
    clearGpxData();
  };

  const handleSwitchToUpload = () => {
    haptics.light();
    setMode("upload");
  };

  const handleDone = () => {
    if (mode === "upload") {
      handleConfirmGpx();
    } else {
      onDone();
    }
  };

  const doneDisabled = mode === "upload" && derivedSegments.length === 0;

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

        {/* Section header + mode toggle */}
        <div className="flex gap-[24px] items-center w-full shrink-0">
          <div className="flex-1 min-w-0">
            <div className="bg-[#0b0b0b] flex gap-[8px] items-center px-px inline-flex shrink-0">
              <IconSegments className="size-3 shrink-0 invert" />
              <span className="font-['TX-02'] uppercase text-[#f8f8f8] text-[14px] font-normal tracking-[-0.02em] leading-[0.85]">
                Edit Segments
              </span>
            </div>
          </div>

          {mode === "upload" ? (
            <button
              type="button"
              onClick={handleSwitchToManual}
              className="bg-[#d9d9d9] flex gap-[4px] items-center justify-center px-[8px] py-[6px] rounded-[4px] shrink-0"
            >
              <IconEdit className="size-3 shrink-0" />
              <span className="font-['TX-02'] uppercase text-[#0b0b0b] text-[14px] font-normal tracking-[-0.02em] leading-[0.85]">
                Manual
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSwitchToUpload}
              className="bg-[#d9d9d9] flex gap-[4px] items-center justify-center px-[8px] py-[6px] rounded-[4px] shrink-0"
            >
              <IconAdd className="size-3 shrink-0" />
              <span className="font-['TX-02'] uppercase text-[#0b0b0b] text-[14px] font-normal tracking-[-0.02em] leading-[0.85]">
                Upload
              </span>
            </button>
          )}
        </div>

        {/* Upload mode */}
        {mode === "upload" && (
          gpxPoints ? (
            <>
              <ElevationProfile
                key={gpxUploadCount}
                points={gpxPoints}
                filename={gpxFilename}
                initialSplits={gpxUploadCount === 0 ? initialSplits : undefined}
                onSegmentsChange={(newSegs) => {
                  setDerivedSegments((prev) =>
                    newSegs.map((s, i) => {
                      const prevSeg = prev[i];
                      if (!prevSeg) return s; // new segment — use grade label
                      // Preserve name only if user manually edited it (differs from auto grade label)
                      const wasAutoLabel = !prevSeg.name || prevSeg.name === gradeLabel(prevSeg.grade);
                      return { ...s, name: wasAutoLabel ? s.name : prevSeg.name };
                    })
                  );
                }}
              />
              {/* Allow replacing the file without leaving upload mode */}
              <button
                type="button"
                onClick={handleUploadClick}
                className="self-start flex gap-[4px] items-center"
              >
                <IconAdd className="size-3 shrink-0" />
                <span className="font-['TX-02'] uppercase text-[#0b0b0b] text-[14px] font-normal tracking-[-0.02em] leading-[0.85]">
                  Replace file
                </span>
              </button>
              <GpxSegmentPreview
                segments={derivedSegments}
                onNameChange={handleNameChange}
              />
            </>
          ) : (
            <>
              {/* Empty upload placeholder — bordered container with centred upload button */}
              <button
                type="button"
                onClick={handleUploadClick}
                className="w-full h-[152px] flex items-center justify-center"
                style={{ border: "0.5px solid #d9d9d9" }}
              >
                <div className="bg-[#d9d9d9] flex gap-[4px] items-center justify-center px-[8px] py-[6px] rounded-[4px]">
                  <IconAdd className="size-3 shrink-0" />
                  <span className="font-['TX-02'] uppercase text-[#0b0b0b] text-[14px] font-normal tracking-[-0.02em] leading-[0.85]">
                    Upload
                  </span>
                </div>
              </button>

              {/* Skeleton row */}
              <div className="flex gap-[8px] items-center">
                <div className="bg-[#d9d9d9] rounded-[2px] shrink-0 size-3" />
                <div className="bg-[#d9d9d9] h-3 rounded-[2px] shrink-0 w-8" />
              </div>
            </>
          )
        )}

        {/* Manual mode — segment rows */}
        {mode === "manual" && (
          <>
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
            <button
              type="button"
              onClick={handleAdd}
              className="self-start flex gap-[4px] items-center"
            >
              <IconAdd className="size-3 shrink-0" />
              <span className="font-['TX-02'] uppercase text-[#0b0b0b] text-[14px] font-normal tracking-[-0.02em] leading-[0.85]">
                Add segment
              </span>
            </button>
          </>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".gpx"
          className="hidden"
          onChange={handleFileChange}
        />

        <Divider />

        {/* Bottom action row */}
        <div className="flex gap-[16px] items-center justify-end w-full shrink-0">
          <button
            type="button"
            onClick={() => { haptics.light(); onDone(); }}
            className="flex gap-[4px] items-center justify-center"
          >
            <IconCancel className="size-3 shrink-0" />
            <span className="font-['TX-02'] uppercase text-[#0b0b0b] text-[14px] font-normal tracking-[-0.02em] leading-[0.85]">
              Cancel
            </span>
          </button>
          <button
            type="button"
            onClick={handleDone}
            disabled={doneDisabled}
            className="bg-[#f86d23] flex gap-[4px] items-center justify-center px-[8px] py-[6px] rounded-[4px] disabled:opacity-40"
          >
            <IconConfirm className="size-3 shrink-0" />
            <span className="font-['TX-02'] uppercase text-[#0b0b0b] text-[14px] font-normal tracking-[-0.02em] leading-[0.85]">
              Done
            </span>
          </button>
        </div>

      </div>
    </div>
  );
}
