import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";

/**
 * Haptic feedback — uses the Taptic Engine on iOS (via Capacitor) and the
 * Web Vibration API on Android. Silently no-ops on desktop browsers.
 */

function vibrate(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

const isNative = Capacitor.isNativePlatform();

export const haptics = {
  /** Subtle tap — navigation, toggles, mode switches */
  light: () =>
    isNative
      ? Haptics.impact({ style: ImpactStyle.Light })
      : vibrate(10),

  /** Standard tap — adding items, confirming actions */
  medium: () =>
    isNative
      ? Haptics.impact({ style: ImpactStyle.Medium })
      : vibrate(25),

  /** Strong tap — destructive actions (remove/delete) */
  heavy: () =>
    isNative
      ? Haptics.impact({ style: ImpactStyle.Heavy })
      : vibrate(50),

  /** Double pulse — errors or disabled-state feedback */
  error: () =>
    isNative
      ? Haptics.notification({ type: NotificationType.Error })
      : vibrate([30, 60, 30]),
};
