import { useEffect, useRef } from "react";

/**
 * Minimal hook that prints gamepad input changes to the console.
 * It is intentionally conservative to avoid spamming logs.
 */
export function useGamepadDebug(isEnabled: boolean, pollHz: number = 20) {
  const lastHashRef = useRef<string>("");

  useEffect(() => {
    if (!isEnabled) return;

    /**
     * Returns the first available gamepad (if any).
     */
    const getFirstGamepad = (): Gamepad | null => {
      const pads = navigator.getGamepads?.() ?? [];
      for (const gp of pads) {
        if (gp) return gp;
      }
      return null;
    };

    /**
     * Builds a small snapshot for change detection and readable logging.
     */
    const buildSnapshot = (gp: Gamepad) => {
      const axes = gp.axes.map((a) => Math.round(a * 100) / 100);
      const pressedButtons: number[] = [];

      gp.buttons.forEach((b, i) => {
        const pressed = typeof b === "number" ? b > 0.5 : b.pressed;
        if (pressed) pressedButtons.push(i);
      });

      return { axes, pressedButtons };
    };

    const intervalMs = Math.max(10, Math.floor(1000 / pollHz));

    const tick = () => {
      const gp = getFirstGamepad();
      if (!gp) {
        // Reset so the first input after reconnect is logged.
        lastHashRef.current = "";
        return;
      }

      const snap = buildSnapshot(gp);
      const hash = JSON.stringify(snap);

      // Only log when something changes.
      if (hash !== lastHashRef.current) {
        lastHashRef.current = hash;
        console.log("[Gamepad] Input changed:", {
          index: gp.index,
          id: gp.id,
          ...snap,
        });
      }
    };

    const intervalId = window.setInterval(tick, intervalMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isEnabled, pollHz]);
}
