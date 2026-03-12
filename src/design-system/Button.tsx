import { IconAdd, IconEdit } from "./icons";

export type ButtonVariant = "Primary" | "Secondary" | "Tertiary" | "Text";

interface ButtonProps {
  variant?: ButtonVariant;
  icon?: "add" | "edit" | null;
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
}

export function Button({
  variant = "Primary",
  icon = null,
  children,
  onClick,
  type = "button",
  className = "",
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded font-[var(--ds-font-family)] text-[length:var(--ds-font-size)] font-normal uppercase tracking-[var(--ds-letter-spacing)] leading-[var(--ds-line-height)] transition-opacity hover:opacity-90";

  const variants = {
    Primary: "bg-[var(--ds-orange)] text-[var(--ds-black)]",
    Secondary: "bg-[var(--ds-grey)] text-[var(--ds-black)]",
    Tertiary: "border border-[var(--ds-black)] text-[var(--ds-black)] bg-transparent",
    Text: "bg-transparent text-[var(--ds-black)]",
  };

  const Icon = icon === "add" ? IconAdd : icon === "edit" ? IconEdit : null;

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {Icon && variant !== "Text" && <Icon />}
      {children}
    </button>
  );
}
