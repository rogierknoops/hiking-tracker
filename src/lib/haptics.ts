/**
 * Haptic feedback via the Web Vibration API.
 * Silently no-ops on browsers that don't support it (e.g. iOS Safari, desktop).
 */

function vibrate(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

export const haptics = {
  /** Subtle tap — navigation, toggles, mode switches */
  light: () => vibrate(10),

  /** Standard tap — adding items, confirming actions */
  medium: () => vibrate(25),

  /** Strong tap — destructive actions (remove/delete) */
  heavy: () => vibrate(50),

  /** Double pulse — errors or disabled-state feedback */
  error: () => vibrate([30, 60, 30]),
};
