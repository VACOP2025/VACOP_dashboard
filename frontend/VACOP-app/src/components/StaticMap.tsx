import React, { useState } from "react";
import { RobotMap } from "./RobotMap";

export default function Demo() {
  const [position, setPosition] = useState({ lat: 43.6045, lng: 1.4442 });

  return (
    <div style={{ padding: 16 }}>
      <RobotMap position={position} zoom={19} follow />

      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <button onClick={() => setPosition(p => ({ ...p, lat: p.lat + 0.0002 }))}>Nord</button>
        <button onClick={() => setPosition(p => ({ ...p, lat: p.lat - 0.0002 }))}>Sud</button>
        <button onClick={() => setPosition(p => ({ ...p, lng: p.lng + 0.0002 }))}>Est</button>
        <button onClick={() => setPosition(p => ({ ...p, lng: p.lng - 0.0002 }))}>Ouest</button>
      </div>

      <div style={{ marginTop: 8, fontFamily: "monospace" }}>
        lat={position.lat.toFixed(6)} lng={position.lng.toFixed(6)}
      </div>
    </div>
  );
}
