const fullAsset = "https://www.figma.com/api/mcp/asset/7f01c4aa-4e31-4a86-8bc5-0b448d78da89";
const shortAsset = "https://www.figma.com/api/mcp/asset/f390c462-7d07-4112-86da-4ec6389b0cb3";

export type DividerLength = "Full" | "Short";

interface DividerProps {
  length?: DividerLength;
  className?: string;
}

export function Divider({ length = "Full", className = "" }: DividerProps) {
  const isShort = length === "Short";
  return (
    <div
      className={`relative shrink-0 h-[5.894px] ${isShort ? "w-[28.606px]" : "w-full"} ${className}`}
      aria-hidden
    >
      <img
        src={isShort ? shortAsset : fullAsset}
        alt=""
        className="absolute block max-w-none size-full"
      />
    </div>
  );
}
