/**
 * Syntax-highlighted display of the Naismith + Langmuir formula.
 * Matches the code-block aesthetic from Figma node 10005:13159.
 * Font: 12px TX-02, uppercase. Grey comments, black code, blue vars, purple results.
 */

const comment = "font-['TX-02'] font-[350] text-[12px] uppercase tracking-[-0.02em] leading-[1.5] text-[#8c8c8c]";
const code    = "font-['TX-02'] font-[400] text-[12px] uppercase tracking-[-0.02em] leading-[1.5] text-[#0b0b0b]";
const blue    = "text-[#2a79fb]";
const purple  = "text-[#b510a9]";

export function FormulaDisplay() {
  return (
    <div className="flex flex-col gap-[16px] w-full">

      {/* ── Section 1: Base Naismith ─────────────────────────────── */}
      <div className="flex flex-col">
        <p className={comment}>{"/* Base Naismith (hours) */"}</p>
        <p className={code}>
          <span className={purple}>Tₙ</span>
          <span>{" = ("}</span>
          <span className={blue}>Distance_km</span>
          <span>{" ÷ 5) + ("}</span>
          <span className={blue}>Ascent_m</span>
          <span>{" ÷ 600)"}</span>
        </p>
      </div>

      {/* ── Section 2: Langmuir adjustments ─────────────────────── */}
      <div className="flex flex-col">
        <p className={comment}>{"/* Langmuir adjustments for descent */"}</p>
        <p className={`${code} whitespace-pre`}>{"<5°    = +0"}</p>
        <p className={`${code} whitespace-pre`}>
          <span>{"5–12°  = -("}</span>
          <span className={blue}>{"descent_m"}</span>
          <span>{" / 1800)"}</span>
        </p>
        <p className={`${code} whitespace-pre`}>
          <span>{">12°   = +("}</span>
          <span className={blue}>{"descent_m"}</span>
          <span>{" / 1800)"}</span>
        </p>
      </div>

      {/* ── Section 3: Final time ────────────────────────────────── */}
      <div className="flex flex-col">
        <p className={comment}>{"/* Final time */"}</p>
        <p className={code}>
          <span className={purple}>T_total</span>
          <span>{" = "}</span>
          <span className={purple}>Tₙ</span>
          <span>{" + "}</span>
          <span className={purple}>Langmuir_adjustment</span>
        </p>
      </div>

    </div>
  );
}
