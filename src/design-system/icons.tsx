/**
 * Icon components using fresh Figma asset URLs.
 * object-contain preserves each icon's natural aspect ratio within the 12×12 container,
 * preventing the distortion caused by stretching non-square images to fill a square box.
 */

import { iconAssets } from "./icon-assets";

const iconClass = "size-3 shrink-0 object-contain";

interface IconProps {
  className?: string;
}

export function IconSummary({ className = iconClass }: IconProps) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={className} aria-hidden>
      <path d="M 2 5 L 10 5 M 2 7 L 10 7" stroke="currentColor" strokeWidth="1" strokeLinecap="square" />
    </svg>
  );
}

export function IconSegments({ className = iconClass }: IconProps) {
  return <img src={iconAssets.segments} alt="" aria-hidden className={`${className} object-contain`} />;
}

export function IconFormula({ className = iconClass }: IconProps) {
  return <img src={iconAssets.formula} alt="" aria-hidden className={`${className} object-contain`} />;
}

export function IconAdd({ className = iconClass }: IconProps) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={className} aria-hidden>
      <path d="M 6 2 L 6 10 M 2 6 L 10 6" stroke="currentColor" strokeWidth="1" strokeLinecap="square" />
    </svg>
  );
}

export function IconEdit({ className = iconClass }: IconProps) {
  return <img src={iconAssets.edit} alt="" aria-hidden className={`${className} object-contain`} />;
}

export function IconArrowDown({ className = iconClass }: IconProps) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      {/* Filled downward triangle — 7.5×10px within 12×12, inset 1px top/bottom, 2.25px left/right */}
      <path d="M 2.25 1 L 9.75 1 L 6 11 Z" />
    </svg>
  );
}

export function IconArrowUp({ className = iconClass }: IconProps) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      {/* Same triangle flipped vertically */}
      <path d="M 2.25 11 L 9.75 11 L 6 1 Z" />
    </svg>
  );
}

export function IconLog({ className = iconClass }: IconProps) {
  return <img src={iconAssets.log} alt="" aria-hidden className={`${className} object-contain`} />;
}

export function IconConfirm({ className = iconClass }: IconProps) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={className} aria-hidden>
      <path d="M 2.5 6.25 L 5 8.5 L 9.5 4" stroke="currentColor" strokeWidth="1" strokeLinecap="square" />
    </svg>
  );
}

export function IconCancel({ className = iconClass }: IconProps) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={className} aria-hidden>
      <path d="M 2.82 2.82 L 9.18 9.18 M 9.18 2.82 L 2.82 9.18" stroke="currentColor" strokeWidth="1" strokeLinecap="square" />
    </svg>
  );
}

export function IconDelete({ className = iconClass }: IconProps) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={className} aria-hidden>
      <path d="M 2 6 L 10 6" stroke="currentColor" strokeWidth="1" strokeLinecap="square" />
    </svg>
  );
}

export function IconNested({ className = iconClass }: IconProps) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      className={className}
      aria-hidden
    >
      <path d="M 3 2.5 L 3 7.5 L 9.5 7.5" stroke="currentColor" strokeWidth="1" strokeLinecap="square" />
    </svg>
  );
}
