import { useRef } from "react";
import { useHikeStore } from "../stores/hikeStore";
import { Divider } from "../design-system";
import { IconAdd, IconEdit, IconNested } from "../design-system/icons";
import { getExpectedArrivalAtSegment } from "../lib/calculations";
import type { Segment } from "../types";

const tx02 =
  "font-['TX-02'] text-[14px] uppercase tracking-[-0.02em] leading-[0.85] text-[#0b0b0b]";
const tx02Bold =
  "font-['TX-02'] font-bold text-[14px] uppercase tracking-[-0.02em] leading-[0.85] text-[#0b0b0b]";

const Skeleton = () => (
  <div className="bg-[#d9d9d9] h-[12px] rounded-[2px] w-[32px] shrink-0" />
);

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDuration(minutes: number): string {
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${h}H${m.toString().padStart(2, "0")}M`;
}

function calcGrade(ascent: number, descent: number, distanceKm: number): string {
  if (distanceKm === 0) return "0°";
  const rise = ascent + descent;
  const run = distanceKm * 1000;
  return `${Math.round(Math.atan(rise / run) * (180 / Math.PI))}°`;
}

interface SegmentCardProps {
  segment: Segment;
  index: number;
  cumulativeDistance: number;
  expectedArrival: string;
  previousArrival: string | null;
  isActive: boolean;
  onLog: () => void;
  onEditTime: (iso: string) => void;
}

function SegmentCard({
  segment,
  index,
  cumulativeDistance,
  expectedArrival,
  previousArrival,
  isActive,
  onLog,
  onEditTime,
}: SegmentCardProps) {
  const timeInputRef = useRef<HTMLInputElement>(null);
  const isCompleted = !!segment.actualArrivalTime;

  const actualDuration =
    isCompleted && previousArrival
      ? Math.round(
          (new Date(segment.actualArrivalTime!).getTime() -
            new Date(previousArrival).getTime()) /
            60000
        )
      : null;

  const margin =
    isCompleted && actualDuration !== null && segment.plannedDuration != null
      ? segment.plannedDuration - actualDuration
      : null;

  return (
    <div className="flex flex-col gap-[24px] w-full">
      {/* Segment title: [n] [name] */}
      <div className="flex gap-[8px] items-center">
        <span className={`${tx02Bold} w-[12px] shrink-0`}>{index}</span>
        <span className={tx02Bold}>
          {segment.name || `Segment ${index}`}
        </span>
      </div>

      {/* Two-column info row */}
      <div className="flex gap-[16px] items-start w-full">
        {/* Left: geographic stats */}
        <div className="flex-1 flex flex-col gap-[16px]">
          {/* DISTANCE */}
          <div className="flex gap-[16px] items-start">
            <span className={`${tx02} w-[78px] shrink-0`}>Distance</span>
            <span className={tx02}>{segment.distance}KM</span>
          </div>
          {/* → TOTAL (cumulative) */}
          <div className="flex gap-[18px] items-start pl-[8px]">
            <div className="flex gap-[2px] items-center shrink-0">
              <IconNested className="size-3 shrink-0" />
              <span className={`${tx02} w-[54px]`}>Total</span>
            </div>
            <span className={`${tx02} whitespace-nowrap`}>{cumulativeDistance}KM</span>
          </div>
          {/* ASCENT */}
          <div className="flex gap-[16px] items-start">
            <span className={`${tx02} w-[78px] shrink-0`}>Ascent</span>
            <span className={tx02}>+{segment.ascent}m</span>
          </div>
          {/* DESCENT */}
          <div className="flex gap-[16px] items-start">
            <span className={`${tx02} w-[78px] shrink-0`}>Descent</span>
            <span className={tx02}>-{segment.descent}m</span>
          </div>
          {/* GRADE */}
          <div className="flex gap-[16px] items-start">
            <span className={`${tx02} w-[78px] shrink-0`}>Grade</span>
            <span className={tx02}>
              {calcGrade(segment.ascent, segment.descent, segment.distance)}
            </span>
          </div>
        </div>

        {/* Right: timing (171px wide)
            Active segment uses gap-[10px] between the three sections;
            all others use gap-[16px]. */}
        <div className={`flex flex-col ${isActive ? "gap-[10px]" : "gap-[16px]"} w-[171px] shrink-0`}>
          {/* Section 1: PLANNED arrival + planned → DUR. */}
          <div className="flex flex-col gap-[16px] w-full">
            <div className="flex items-start justify-between w-full">
              <span className={`${tx02} w-[58px] shrink-0`}>Planned</span>
              <span className={tx02}>{formatTime(expectedArrival)}</span>
            </div>
            {/* → DUR.: shows planned duration once the segment is reachable */}
            <div className="flex items-start justify-between pl-[8px] pr-[3px] w-full">
              <div className="flex gap-[2px] items-center shrink-0">
                <IconNested className="size-3 shrink-0" />
                <span className={`${tx02} w-[58px]`}>Dur.</span>
              </div>
              {(isActive || isCompleted) && segment.plannedDuration != null ? (
                <span className={`${tx02} whitespace-nowrap`}>{formatDuration(segment.plannedDuration)}</span>
              ) : (
                <Skeleton />
              )}
            </div>
          </div>

          {/* Section 2: ACTUAL arrival time or LOG button */}
          <div className="flex items-center justify-between w-full">
            <span className={`${tx02} w-[49px] shrink-0`}>Actual</span>
            {isCompleted ? (
              /* Grey edit button with hidden native time picker */
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    timeInputRef.current?.showPicker?.() ??
                    timeInputRef.current?.click()
                  }
                  className="bg-[#d9d9d9] flex gap-[4px] items-center justify-center px-[8px] py-[6px] rounded-[4px] hover:opacity-90"
                >
                  <IconEdit className="size-3 shrink-0" />
                  <span className={`${tx02} whitespace-nowrap`}>
                    {formatTime(segment.actualArrivalTime!)}
                  </span>
                </button>
                <input
                  ref={timeInputRef}
                  type="time"
                  value={formatTime(segment.actualArrivalTime!)}
                  onChange={(e) => {
                    if (!e.target.value) return;
                    const [h, m] = e.target.value.split(":").map(Number);
                    const d = new Date(segment.actualArrivalTime!);
                    d.setHours(h, m, 0, 0);
                    onEditTime(d.toISOString());
                  }}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  aria-hidden
                />
              </div>
            ) : isActive ? (
              <button
                onClick={onLog}
                className="bg-[#f86d23] flex gap-[4px] items-center justify-center px-[8px] py-[6px] rounded-[4px] cursor-pointer hover:opacity-90"
              >
                <IconAdd className="size-3 shrink-0" />
                <span className={`${tx02} whitespace-nowrap`}>Log</span>
              </button>
            ) : (
              <Skeleton />
            )}
          </div>

          {/* Section 3: actual → DUR. + MARGIN */}
          <div className="flex flex-col gap-[16px] w-full">
            <div className="flex items-start justify-between pl-[8px] pr-[3px] w-full">
              <div className="flex gap-[2px] items-center shrink-0">
                <IconNested className="size-3 shrink-0" />
                <span className={`${tx02} w-[58px]`}>Dur.</span>
              </div>
              {actualDuration !== null ? (
                <span className={`${tx02} whitespace-nowrap`}>{formatDuration(actualDuration)}</span>
              ) : (
                <Skeleton />
              )}
            </div>
            <div className="flex items-start justify-between w-full">
              <span className={`flex-1 ${tx02}`}>Margin</span>
              {margin !== null ? (
                <div
                  className={`flex items-center justify-center px-[1px] shrink-0 ${
                    margin > 0 ? "bg-[var(--ds-positive)]" : "bg-[var(--ds-negative)]"
                  }`}
                >
                  <span className={`${tx02} whitespace-nowrap`}>
                    {formatDuration(Math.abs(margin))}
                  </span>
                </div>
              ) : (
                <Skeleton />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SegmentList() {
  const segments = useHikeStore((s) => s.segments);
  const departureTime = useHikeStore((s) => s.departureTime);
  const departureLogged = useHikeStore((s) => s.departureLogged);
  const logArrival = useHikeStore((s) => s.logArrival);
  const updateSegment = useHikeStore((s) => s.updateSegment);

  if (segments.length === 0) return null;

  let cumulativeDistance = 0;

  return (
    <>
      {segments.map((segment, index) => {
        cumulativeDistance = Math.round((cumulativeDistance + segment.distance) * 10) / 10;
        const expectedArrival = getExpectedArrivalAtSegment(
          departureTime,
          segments,
          index
        );
        const previousArrival =
          index === 0
            ? departureTime
            : segments[index - 1].actualArrivalTime ?? null;

        // Active = departure logged, this segment not yet logged, and the
        // previous waypoint (departure or prior segment) has a known time.
        const isActive =
          departureLogged &&
          !segment.actualArrivalTime &&
          previousArrival !== null;

        return (
          <div key={segment.id} className="flex flex-col gap-[24px]">
            <SegmentCard
              segment={segment}
              index={index + 1}
              cumulativeDistance={cumulativeDistance}
              expectedArrival={expectedArrival}
              previousArrival={previousArrival}
              isActive={isActive}
              onLog={() => logArrival(segment.id)}
              onEditTime={(iso) => updateSegment(segment.id, { actualArrivalTime: iso })}
            />
            {index < segments.length - 1 && <Divider length="Short" />}
          </div>
        );
      })}
    </>
  );
}
