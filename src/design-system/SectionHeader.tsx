import { Header, type HeaderIcon } from "./Header";
import { IconArrowDown } from "./icons";

export type SectionHeaderType = "Default" | "Action" | "Dropdown";

interface SectionHeaderProps {
  label: string;
  icon?: HeaderIcon;
  type?: SectionHeaderType;
  actionLabel?: string;
  onAction?: () => void;
  expanded?: boolean;
  onToggle?: () => void;
  className?: string;
}

export function SectionHeader({
  label,
  icon = "summary",
  type = "Default",
  actionLabel,
  onAction,
  expanded,
  onToggle,
  className = "",
}: SectionHeaderProps) {
  return (
    <div className={`flex flex-col items-start w-full ${className}`}>
      <div className="flex items-center justify-between w-full">
        {onToggle ? (
          <button
            type="button"
            onClick={onToggle}
            className="cursor-pointer hover:opacity-90"
          >
            <Header label={label} icon={icon} />
          </button>
        ) : (
          <Header label={label} icon={icon} />
        )}
        {type === "Action" && actionLabel && (
          <button
            type="button"
            onClick={onAction}
            className="font-[var(--ds-font-family)] text-[length:var(--ds-font-size)] font-normal uppercase tracking-[var(--ds-letter-spacing)] text-[var(--ds-black)] hover:underline"
          >
            {actionLabel}
          </button>
        )}
        {type === "Dropdown" && (
          <button
            type="button"
            onClick={onToggle}
            className="flex items-center justify-center size-3 text-[var(--ds-black)]"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            <IconArrowDown
              className={`size-3 object-contain transition-transform ${expanded ? "rotate-180" : ""}`}
            />
          </button>
        )}
      </div>
    </div>
  );
}
