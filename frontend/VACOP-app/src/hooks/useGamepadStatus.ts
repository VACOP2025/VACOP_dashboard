import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Describes a minimal gamepad identity for UI and debugging.
 */
export interface GamepadInfo {
  id: string;
  index: number;
  mapping: string;
}

/**
 * React hook that tracks whether at least one gamepad is connected.
 * It also provides a minimal "active" gamepad info object for debugging.
 *
 * Notes:
 * - Many browsers only expose the gamepad after the user presses a button once.
 * - This hook keeps the implementation intentionally small and safe.
 */
export function useGamepadStatus(enableDebugLogs: boolean = true) {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [activeGamepad, setActiveGamepad] = useState<GamepadInfo | null>(null);

  const debugOnceRef = useRef<boolean>(false);

  /**
   * Reads currently available gamepads and returns the first non-null entry.
   */
  const getFirstGamepad = (): Gamepad | null => {
    const pads = navigator.getGamepads?.() ?? [];
    for (const gp of pads) {
      if (gp) return gp;
    }
    return null;
  };

  useEffect(() => {
  /**
   * Updates React state based on the currently connected gamepads.
   * This is used both for event-driven updates and a periodic resync.
   */
  const refreshStatus = () => {
    const gp = getFirstGamepad();

    const nextConnected = !!gp;
    setIsConnected(nextConnected);

    if (gp) {
      setActiveGamepad({
        id: gp.id,
        index: gp.index,
        mapping: gp.mapping ?? "unknown",
      });

      // Print only once on first detection to avoid spamming the console.
      if (enableDebugLogs && !debugOnceRef.current) {
        debugOnceRef.current = true;
        console.log("[Gamepad] Detected:", {
          id: gp.id,
          index: gp.index,
          mapping: gp.mapping,
        });
      }
    } else {
      setActiveGamepad(null);
      debugOnceRef.current = false;
    }
  };

  /**
   * Browser event fired on connect (when supported).
   */
  const onConnect = (e: GamepadEvent) => {
    if (enableDebugLogs) {
      console.log("[Gamepad] Connected event:", {
        id: e.gamepad.id,
        index: e.gamepad.index,
        mapping: e.gamepad.mapping,
      });
    }
    refreshStatus();
  };

  /**
   * Browser event fired on disconnect (when supported).
   * We immediately force the UI state to "disconnected" because some browsers
   * may keep a stale gamepad entry in navigator.getGamepads() for a short time.
   */
  const onDisconnect = (e: GamepadEvent) => {
    if (enableDebugLogs) {
      console.log("[Gamepad] Disconnected event:", {
        id: e.gamepad.id,
        index: e.gamepad.index,
      });
    }

    // Force immediate UI update (no waiting on getGamepads()).
    setIsConnected(false);
    setActiveGamepad(null);
    debugOnceRef.current = false;

    // Resync shortly after to handle edge cases / multiple pads.
    window.setTimeout(refreshStatus, 100);
  };

  window.addEventListener("gamepadconnected", onConnect);
  window.addEventListener("gamepaddisconnected", onDisconnect);

  // Initial check (useful if the pad is already connected before page load).
  refreshStatus();

  /**
   * Periodic resync: ensures status updates even if disconnect events are flaky.
   * Keep it slow to avoid unnecessary work.
   */
  const resyncIntervalId = window.setInterval(refreshStatus, 500);

  return () => {
    window.removeEventListener("gamepadconnected", onConnect);
    window.removeEventListener("gamepaddisconnected", onDisconnect);
    window.clearInterval(resyncIntervalId);
  };
}, [enableDebugLogs]);

  return useMemo(
    () => ({ isConnected, activeGamepad }),
    [isConnected, activeGamepad]
  );
}
