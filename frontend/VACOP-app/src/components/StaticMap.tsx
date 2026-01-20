
import React, { useCallback, useMemo, useState } from "react";
import { RobotMap } from "./RobotMap";

type LatLng = { lat: number; lng: number };

/**
 * Demo component used to validate the map rendering and camera-follow behavior.
 * This is intentionally simple, but includes:
 * - typed state
 * - memoized step value
 * - stable handlers (useCallback) to avoid unnecessary rerenders
 * - accessible button labels
 */
export default function Demo() {
  const [position, setPosition] = useState<LatLng>({ lat: 43.6045, lng: 1.4442 });

  // Small delta (~20m at mid-latitudes is ~0.0002 deg, but this is just a UI demo)
  const step = useMemo(() => 0.0002, []);

  /**
   * Generic position updater.
   * Using a single function keeps the code DRY and makes it easy to change step logic later.
   */
  const move = useCallback((dLat: number, dLng: number) => {
    setPosition((prev) => ({
      lat: prev.lat + dLat,
      lng: prev.lng + dLng,
    }));
  }, []);

  const moveNorth = useCallback(() => move(+step, 0), [move, step]);
  const moveSouth = useCallback(() => move(-step, 0), [move, step]);
  const moveEast = useCallback(() => move(0, +step), [move, step]);
  const moveWest = useCallback(() => move(0, -step), [move, step]);

  return (
    <div style={{ padding: 16 }}>
      {/* 
        Map widget.
        If your RobotMap component supports controlled mode, pass `position`.
        If RobotMap pulls live telemetry by itself, you can omit this and only pass backendUrl.
      */}
      <RobotMap zoom={19} follow />

      <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" onClick={moveNorth} aria-label="Move marker north">
          North
        </button>
        <button type="button" onClick={moveSouth} aria-label="Move marker south">
          South
        </button>
        <button type="button" onClick={moveEast} aria-label="Move marker east">
          East
        </button>
        <button type="button" onClick={moveWest} aria-label="Move marker west">
          West
        </button>
      </div>

      <div style={{ marginTop: 8, fontFamily: "monospace" }}>
        lat={position.lat.toFixed(6)} lng={position.lng.toFixed(6)}
      </div>
    </div>
  );
}
