import { Parser } from "expr-eval";

/**
 * Evaluates a duration formula for a segment.
 * Variables: d = distance (km), a = ascent (m), descent = descent (m)
 * Formula should evaluate to hours; result is converted to minutes.
 * Default Naismith: (d/5) + (a/600) -> hours
 */
export function evaluateDuration(
  formula: string,
  distance: number,
  ascent: number,
  descent: number
): number {
  try {
    const parser = new Parser();
    const expr = parser.parse(formula || "(d/5) + (a/600)");
    const hours = expr.evaluate({ d: distance, a: ascent, descent });
    return Math.round((typeof hours === "number" ? hours : 0) * 60);
  } catch {
    return 0;
  }
}

export const DEFAULT_FORMULA = "(d/5) + (a/600)";
