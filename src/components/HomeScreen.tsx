import { useState } from "react";
import { useHikeStore } from "../stores/hikeStore";
import { Divider, SectionHeader } from "../design-system";
import { IconSummary } from "../design-system/icons";
import { TrailSummary } from "./TrailSummary";
import { SegmentList } from "./SegmentList";
import { FormulaDisplay } from "./FormulaDisplay";
import { DaySwitchOverlay } from "./DaySwitchOverlay";

interface HomeScreenProps {
  onEditSegments: () => void;
}

const tx02 = "font-['TX-02'] text-[14px] uppercase tracking-[-0.02em] leading-[0.85] text-[#0b0b0b]";

export function HomeScreen({ onEditSegments }: HomeScreenProps) {
  const currentDayIndex = useHikeStore((s) => s.currentDayIndex);
  const name = useHikeStore((s) => s.name);

  const [expandedFormula, setExpandedFormula] = useState(false);
  const [daySwitchOpen, setDaySwitchOpen] = useState(false);

  return (
    <>
      <div
        className="bg-[#f8f8f8] min-h-screen flex flex-col gap-[40px] pb-[40px] pt-[80px] px-[16px]"
        style={{ maxWidth: 390, margin: "0 auto" }}
      >
        {/* Page Header — two rows */}
        <div className="flex flex-col gap-[40px] w-full shrink-0">
          {/* Row 1: title + menu icon (opens day-switch overlay) */}
          <div className="flex items-start justify-between w-full">
            <span className={`${tx02} font-bold`}>Hiking Pace Planner</span>
            <button
              type="button"
              onClick={() => setDaySwitchOpen(true)}
              className="hover:opacity-70"
              aria-label="Switch days"
            >
              <IconSummary className="size-3 shrink-0" />
            </button>
          </div>
          {/* Row 2: current day pill + route name */}
          <div className="flex gap-[8px] items-start">
            <div className="bg-[#0b0b0b] flex items-center px-px shrink-0">
              <span className="font-['TX-02'] uppercase text-[#f8f8f8] text-[14px] font-normal tracking-[-0.02em] leading-[0.85]">
                Day {currentDayIndex + 1}
              </span>
            </div>
            <span className={tx02}>/ {name}</span>
          </div>
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
        />
      )}
    </>
  );
}
