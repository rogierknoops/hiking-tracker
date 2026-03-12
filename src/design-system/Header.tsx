import { IconSummary, IconSegments, IconFormula } from "./icons";

export type HeaderIcon = "summary" | "segments" | "formula" | null;

interface HeaderProps {
  label: string;
  icon?: HeaderIcon;
  className?: string;
}

const iconMap = {
  summary: IconSummary,
  segments: IconSegments,
  formula: IconFormula,
};

export function Header({ label, icon = "summary", className = "" }: HeaderProps) {
  const Icon = icon ? iconMap[icon] : null;

  return (
    <div
      className={`bg-[var(--ds-black)] flex items-center gap-2 px-1 ${className}`}
    >
      {Icon && <Icon className="size-3 object-contain invert" />}
      <span className="font-[var(--ds-font-family)] text-[length:var(--ds-font-size)] font-normal uppercase tracking-[var(--ds-letter-spacing)] leading-[var(--ds-line-height)] text-[var(--ds-white)]">
        {label}
      </span>
    </div>
  );
}
