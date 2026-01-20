import { useEffect } from "react";
import { io } from "socket.io-client";

type BackendPos = { ts: string; lat: number; lng: number; topic?: string };

export function useRobotPosition(options: {
  backendUrl: string; // ex: "http://localhost:5000"
  onPosition: (p: { lat: number; lng: number }) => void;
}) {
  const { backendUrl, onPosition } = options;

  useEffect(() => {
    // 1) init: latest via REST
    fetch(`${backendUrl}/api/telemetry/latest`)
      .then((r) => r.json())
      .then((p: BackendPos | null) => {
        if (p) onPosition({ lat: p.lat, lng: p.lng });
      })
      .catch(() => {});

    // 2) live: socket.io
    const socket = io(backendUrl, { transports: ["websocket"] });

    socket.on("robot:position", (p: BackendPos) => {
      onPosition({ lat: p.lat, lng: p.lng });
    });

    return () => {
      socket.disconnect();
    };
  }, [backendUrl, onPosition]);
}
