import { useEffect, useRef } from "react";

/**
 * Configuration for gamepad transmission.
 */
export interface GamepadTransmitOptions {
  /** HTTP endpoint that receives the gamepad state. */
  endpointUrl: string;

  /** Whether to print debug logs in the browser console. */
  enableDebugLogs?: boolean;

  /** Polling frequency in Hz (kept modest on purpose). */
  pollHz?: number;
}

/**
 * Sends the first connected gamepad state to a backend HTTP endpoint.
 * - Only sends when the state changes (simple JSON hash comparison)
 * - Uses a conservative polling rate to keep traffic low
 */
export function useGamepadTransmit(isEnabled: boolean, options: GamepadTransmitOptions) {
  const {
    endpointUrl,
    enableDebugLogs = true,
    pollHz = 20,
  } = options;

  const lastHashRef = useRef<string>("");
  const lastLogAtRef = useRef<number>(0);

  useEffect(() => {
    if (!isEnabled) {
      // Reset so we send immediately when re-enabled.
      lastHashRef.current = "";
      return;
    }

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
     * Creates a compact payload suitable for backend processing.
     * Values are rounded to reduce noise.
     */
    const buildPayload = (gp: Gamepad) => {
      const axes = gp.axes.map((a) => Math.round(a * 1000) / 1000);
      const buttons = gp.buttons.map((b) => {
        const pressed = typeof b === "number" ? b > 0.5 : b.pressed;
        const value = typeof b === "number" ? b : (b.value ?? (pressed ? 1 : 0));
        return { pressed, value: Math.round(value * 1000) / 1000 };
      });

      return {
        ts: Date.now(),
        gamepad: {
          id: gp.id,
          index: gp.index,
          mapping: gp.mapping ?? "unknown",
          axes,
          buttons,
        },
      };
    };

    const intervalMs = Math.max(10, Math.floor(1000 / pollHz));

    const tick = async () => {
      const gp = getFirstGamepad();
      if (!gp) return;

      const payload = buildPayload(gp);
      const hash = JSON.stringify(payload.gamepad);

      // Send only if something changed since last tick.
      if (hash === lastHashRef.current) return;
      lastHashRef.current = hash;

      try {
        const res = await fetch(endpointUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        // Throttle logs (max ~1 log/sec) to keep console readable.
        if (enableDebugLogs) {
          const now = Date.now();
          if (now - lastLogAtRef.current > 1000) {
            lastLogAtRef.current = now;
            console.log("[Gamepad] POST state:", {
              ok: res.ok,
              status: res.status,
              endpointUrl,
            });
          }
        }
      } catch (err) {
        if (enableDebugLogs) {
          console.error("[Gamepad] POST failed:", err);
        }
      }
    };

    const intervalId = window.setInterval(tick, intervalMs);

    if (enableDebugLogs) {
      console.log("[Gamepad] Transmission enabled:", { endpointUrl, pollHz });
    }

    return () => {
      window.clearInterval(intervalId);
      if (enableDebugLogs) {
        console.log("[Gamepad] Transmission disabled.");
      }
    };
  }, [isEnabled, endpointUrl, enableDebugLogs, pollHz]);
}
