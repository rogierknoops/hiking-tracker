/**
 * Icon components backed by the SVG sprite at /icons/sprite.svg.
 *
 * Usage:
 *   <Icon name="summary" />
 *   <Icon name="add" className="size-4 text-ds-orange" />
 *
 * Adding icons: drop a .svg into public/icons/src/, run `npm run icons`.
 *
 * Named exports below are backwards-compatible wrappers kept for existing call sites.
 * Prefer <Icon name="..."> for new code.
 */

const defaultClass = "icon size-3";

interface IconProps {
  name: string;
  className?: string;
}

export function Icon({ name, className = defaultClass }: IconProps) {
  return (
    <svg className={className} aria-hidden focusable="false">
      <use href={`/icons/sprite.svg#icon-${name}`} />
    </svg>
  );
}

// --- Backwards-compatible named exports ---

interface NamedIconProps {
  className?: string;
}

export function IconSummary({ className }: NamedIconProps) {
  return <Icon name="summary" className={className ?? defaultClass} />;
}

export function IconSegments({ className }: NamedIconProps) {
  return <Icon name="segments" className={className ?? defaultClass} />;
}

export function IconFormula({ className }: NamedIconProps) {
  return <Icon name="formula" className={className ?? defaultClass} />;
}

export function IconAdd({ className }: NamedIconProps) {
  return <Icon name="add" className={className ?? defaultClass} />;
}

export function IconEdit({ className }: NamedIconProps) {
  return <Icon name="edit" className={className ?? defaultClass} />;
}

export function IconArrowDown({ className }: NamedIconProps) {
  return <Icon name="arrow-down" className={className ?? defaultClass} />;
}

export function IconArrowUp({ className }: NamedIconProps) {
  return <Icon name="arrow-up" className={className ?? defaultClass} />;
}

export function IconLog({ className }: NamedIconProps) {
  return <Icon name="log" className={className ?? defaultClass} />;
}

export function IconConfirm({ className }: NamedIconProps) {
  return <Icon name="confirm" className={className ?? defaultClass} />;
}

export function IconCancel({ className }: NamedIconProps) {
  return <Icon name="cancel" className={className ?? defaultClass} />;
}

export function IconDelete({ className }: NamedIconProps) {
  return <Icon name="delete" className={className ?? defaultClass} />;
}

export function IconNested({ className }: NamedIconProps) {
  return <Icon name="nested" className={className ?? defaultClass} />;
}

export function IconArrowRight({ className }: NamedIconProps) {
  return <Icon name="arrow-right" className={className ?? defaultClass} />;
}

export function IconUngroup({ className }: NamedIconProps) {
  return <Icon name="ungroup" className={className ?? defaultClass} />;
}
