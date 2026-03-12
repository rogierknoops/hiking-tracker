export type SkeletonType = "Double" | "Single";

interface SkeletonProps {
  type?: SkeletonType;
  className?: string;
}

export function Skeleton({ type = "Double", className = "" }: SkeletonProps) {
  return (
    <div
      className={`flex items-center gap-2 ${type === "Single" ? "" : "gap-2"} ${className}`}
    >
      <div className="bg-[var(--ds-grey)] rounded-[2px] shrink-0 size-3" />
      {type === "Double" && (
        <div className="bg-[var(--ds-grey)] h-3 w-8 rounded-[2px] shrink-0" />
      )}
    </div>
  );
}
