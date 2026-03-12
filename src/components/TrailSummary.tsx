import { useRef } from "react";
import { useHikeStore } from "../stores/hikeStore";
import { Divider } from "../design-system";
import { IconLog, IconEdit } from "../design-system/icons";

const tx02 =
  "font-['TX-02'] text-[14px] uppercase tracking-[-0.02em] leading-[0.85] text-[#0b0b0b]";

const Skeleton = () => (
  <div className="bg-[#d9d9d9] h-[12px] rounded-[2px] w-[32px] shrink-0" />
);

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}H${m.toString().padStart(2, "0")}M`;
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-[16px] items-start">
      <span className={`${tx02} w-[78px] shrink-0`}>{label}</span>
      <span className={tx02}>{value}</span>
    </div>
  );
}

export function TrailSummary() {
  const segments = useHikeStore((s) => s.segments);
  const departureTime = useHikeStore((s) => s.departureTime);
  const departureLogged = useHikeStore((s) => s.departureLogged);
  const setDepartureTime = useHikeStore((s) => s.setDepartureTime);
  const timeInputRef = useRef<HTMLInputElement>(null);

  const totalDistance = segments.reduce((sum, s) => sum + s.distance, 0);
  const totalAscent = segments.reduce((sum, s) => sum + s.ascent, 0);
  const totalDescent = segments.reduce((sum, s) => sum + s.descent, 0);
  const totalPlanned = segments.reduce(
    (sum, s) => sum + (s.plannedDuration ?? 0),
    0
  );

  const lastArrived = [...segments].reverse().find((s) => s.actualArrivalTime);
  const totalActualMinutes =
    lastArrived?.actualArrivalTime
      ? Math.round(
          (new Date(lastArrived.actualArrivalTime).getTime() -
            new Date(departureTime).getTime()) /
            60000
        )
      : null;

  const lastArrivedIdx = segments.reduce(
    (best, s, i) => (s.actualArrivalTime ? i : best),
    -1
  );
  const marginMinutes =
    lastArrivedIdx >= 0
      ? (() => {
          const cumulativePlanned = segments
            .slice(0, lastArrivedIdx + 1)
            .reduce((sum, s) => sum + (s.plannedDuration ?? 0), 0);
          const expectedEnd =
            new Date(departureTime).getTime() + cumulativePlanned * 60000;
          const actualEnd = new Date(
            segments[lastArrivedIdx].actualArrivalTime!
          ).getTime();
          return Math.round((actualEnd - expectedEnd) / 60000);
        })()
      : null;

  return (
    <>
      {/* Departure time row */}
      <div className="flex items-center justify-between w-full shrink-0">
        <span className={tx02}>Departure time</span>

        {departureLogged ? (
          /* After logging: grey edit button showing the time — tapping opens native time picker */
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => timeInputRef.current?.showPicker?.() ?? timeInputRef.current?.click()}
              className="bg-[#d9d9d9] flex gap-[4px] items-center justify-center px-[8px] py-[6px] rounded-[4px]"
            >
              <IconEdit className="size-3 shrink-0" />
              <span className={tx02}>
                {new Date(departureTime).toLocaleTimeString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })}
              </span>
            </button>
            {/* Hidden native time input */}
            <input
              ref={timeInputRef}
              type="time"
              value={new Date(departureTime).toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })}
              onChange={(e) => {
                if (!e.target.value) return;
                const [h, m] = e.target.value.split(":").map(Number);
                const d = new Date(departureTime);
                d.setHours(h, m, 0, 0);
                setDepartureTime(d.toISOString());
              }}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              aria-hidden
            />
          </div>
        ) : (
          /* Before logging: orange LOG button */
          <button
            type="button"
            onClick={() => setDepartureTime(new Date().toISOString())}
            className="bg-[#f86d23] flex gap-[4px] items-center justify-center px-[8px] py-[6px] rounded-[4px] shrink-0"
          >
            <IconLog className="size-3 shrink-0" />
            <span className={tx02}>Log</span>
          </button>
        )}
      </div>

      <Divider length="Short" />

      {/* Two-column stats */}
      <div className="flex gap-[16px] items-start w-full shrink-0">
        {/* Left: geographic totals */}
        <div className="flex-1 flex flex-col gap-[12px]">
          <StatRow label="Distance" value={`${totalDistance}km`} />
          <StatRow label="Ascent" value={`+${totalAscent}m`} />
          <StatRow label="Descent" value={`+${totalDescent}m`} />
        </div>

        {/* Right: timing */}
        <div className="flex flex-col gap-[12px] w-[171px] shrink-0">
          {/* PLANNED row: skeleton (end clock) + total duration */}
          <div className="flex items-start justify-between w-full">
            <span className={`${tx02} w-[58px] shrink-0`}>Planned</span>
            <div className="flex gap-[4px] items-center">
              <Skeleton />
              <span className={tx02}>{formatDuration(totalPlanned)}</span>
            </div>
          </div>
          {/* ACTUAL row */}
          <div className="flex items-start justify-between w-full">
            <span className={`${tx02} w-[49px] shrink-0`}>Actual</span>
            {totalActualMinutes !== null ? (
              <span className={tx02}>{formatDuration(totalActualMinutes)}</span>
            ) : (
              <Skeleton />
            )}
          </div>
          {/* MARGIN row */}
          <div className="flex items-start justify-between w-full">
            <span className={`flex-1 ${tx02}`}>Margin</span>
            {marginMinutes !== null ? (
              <div
                className={`flex items-center justify-center px-[1px] shrink-0 ${
                  marginMinutes >= 0 ? "bg-[var(--ds-orange)]" : "bg-[var(--ds-negative)]"
                }`}
              >
                <span className={`${tx02} whitespace-nowrap`}>
                  {marginMinutes >= 0 ? "+" : ""}
                  {formatDuration(Math.abs(marginMinutes))}
                </span>
              </div>
            ) : (
              <Skeleton />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
