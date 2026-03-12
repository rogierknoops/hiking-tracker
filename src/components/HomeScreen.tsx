import { useState } from "react";
import { useHikeStore } from "../stores/hikeStore";
import { Divider, SectionHeader } from "../design-system";
import { TrailSummary } from "./TrailSummary";
import { SegmentList } from "./SegmentList";
import { FormulaDisplay } from "./FormulaDisplay";
import { DaySwitchOverlay } from "./DaySwitchOverlay";

interface HomeScreenProps {
  onEditSegments: () => void;
}

export function HomeScreen({ onEditSegments }: HomeScreenProps) {
  const segments = useHikeStore((s) => s.segments);
  const currentDayIndex = useHikeStore((s) => s.currentDayIndex);

  const [expandedFormula, setExpandedFormula] = useState(false);
  const [daySwitchOpen, setDaySwitchOpen] = useState(false);

  return (
    <>
      <div
        className="bg-[#f8f8f8] min-h-screen flex flex-col gap-[40px] pb-[40px] pt-[80px] px-[16px]"
        style={{ maxWidth: 390, margin: "0 auto" }}
      >
        {/* Page Title */}
        <div className="flex items-center justify-between w-full shrink-0">
          <span className="font-['TX-02'] uppercase text-[#0b0b0b] text-[14px] font-bold tracking-[-0.02em] leading-[0.85]">
            Hiking Pace Planner
          </span>
          {/* Day indicator — tapping opens the day-switch overlay */}
          <button
            type="button"
            onClick={() => setDaySwitchOpen(true)}
            className="bg-[#0b0b0b] flex items-center px-px hover:opacity-80"
          >
            <span className="font-['TX-02'] uppercase text-[#f8f8f8] text-[14px] font-normal tracking-[-0.02em] leading-[0.85]">
              Day {currentDayIndex + 1}
            </span>
          </button>
        </div>

        <Divider />

        {/* Sections container */}
        <div className="flex flex-col gap-[40px] w-full">

          {/* SUMMARY section */}
          <div className="flex flex-col gap-[24px] w-full">
            <SectionHeader label="Summary" icon="summary" type="Default" />
            <TrailSummary />
          </div>

          <Divider />

          {/* SEGMENTS section */}
          <div className="flex flex-col gap-[24px] w-full">
            <div className="pb-[8px] w-full">
              <SectionHeader
                label="Segments"
                icon="segments"
                type="Action"
                actionLabel="Edit"
                onAction={onEditSegments}
              />
            </div>
            <SegmentList />
          </div>

          <Divider />

          {/* FORMULA section */}
          <div className="flex flex-col gap-[24px] w-full">
            <SectionHeader
              label="Formula"
              icon="formula"
              type="Dropdown"
              expanded={expandedFormula}
              onToggle={() => setExpandedFormula((v) => !v)}
            />
            {expandedFormula && <FormulaDisplay />}
          </div>

        </div>
      </div>

      {/* Day-switch overlay — rendered outside the scrollable content */}
      {daySwitchOpen && (
        <DaySwitchOverlay
          onClose={() => setDaySwitchOpen(false)}
          onEditSegments={() => {
            setDaySwitchOpen(false);
            onEditSegments();
          }}
        />
      )}
    </>
  );
}
