
import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import L from "leaflet";
import { io, type Socket } from "socket.io-client";

type LatLng = { lat: number; lng: number };
type BackendPos = { ts: string; lat: number; lng: number; topic?: string };

type RobotMapProps = {
  backendUrl?: string; // e.g. "http://localhost:5000"
  zoom?: number;
  follow?: boolean;
  height?: number | string;
};

/**
 * Leaflet default marker icons often break with bundlers.
 * Using the CDN URLs is a quick and reliable fix.
 */
const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function FollowCenter({ position, follow }: { position: LatLng; follow: boolean }) {
  const map = useMap();

  useEffect(() => {
    if (!follow) return;
    // Recenter smoothly without changing zoom level.
    map.setView([position.lat, position.lng], map.getZoom(), { animate: true });
  }, [position.lat, position.lng, follow, map]);

  return null;
}

export function RobotMap({
  backendUrl = "http://localhost:5000",
  zoom = 18,
  follow = true,
  height = 220,
}: RobotMapProps) {
  // Local state: rerender only the map subtree.
  const [position, setPosition] = useState<LatLng>({
    lat: 43.6045,
    lng: 1.4442,
  });

  /**
   * Normalize backendUrl to avoid accidental double slashes like:
   *   "http://localhost:5000/" + "/socket.io"  -> "//socket.io"
   */
  const baseUrl = useMemo(() => backendUrl.replace(/\/+$/, ""), [backendUrl]);

  /**
   * React 18 StrictMode runs effects twice in development.
   * This guard prevents creating multiple concurrent Socket.IO connections.
   */
  const socketRef = useRef<Socket | null>(null);
  const didInitRef = useRef(false);

  useEffect(() => {
    // Avoid duplicate init in React StrictMode (dev).
    if (didInitRef.current) return;
    didInitRef.current = true;

    const controller = new AbortController();

    // 1) Initial position via REST (best-effort).
    fetch(`${baseUrl}/api/telemetry/latest`, { signal: controller.signal })
      .then((r) => r.json())
      .then((p: BackendPos | null) => {
        if (p?.lat != null && p?.lng != null) {
          setPosition({ lat: p.lat, lng: p.lng });
        }
      })
      .catch(() => {
        // Ignore: API might be unavailable at first load.
      });

    // 2) Live updates via Socket.IO.
    //
    // IMPORTANT:
    // - Do not force websocket-only. In some environments WebSocket upgrade can fail
    //   (proxy, dev server, eventlet config...), but polling still works reliably.
    // - Putting "polling" first avoids noisy Firefox console warnings during the initial WS attempt.
    const socket = io(baseUrl, {
      path: "/socket.io",
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 3000,
      timeout: 8000,
      // withCredentials: false, // enable only if your backend requires credentials/cookies
    });

    socketRef.current = socket;

    // Optional: useful diagnostics in development.
    socket.on("connect", () => {
      console.debug("[socket.io] connected:", socket.id, "transport:", socket.io.engine.transport.name);
    });

    socket.on("connect_error", (err) => {
      // This often fires when WS upgrade fails; polling may still succeed afterwards.
      console.debug("[socket.io] connect_error:", err?.message ?? err);
    });

    socket.io.on("reconnect_attempt", (attempt) => {
      console.debug("[socket.io] reconnect_attempt:", attempt);
    });

    socket.on("robot:position", (p: BackendPos) => {
      if (p?.lat != null && p?.lng != null) {
        setPosition({ lat: p.lat, lng: p.lng });
      }
    });

    return () => {
      controller.abort();

      // Ensure we cleanly close the socket.
      socket.off();
      socket.disconnect();
      socketRef.current = null;

      // Allow re-init if the component is truly unmounted/remounted.
      didInitRef.current = false;
    };
  }, [baseUrl]);

  const center: LatLngExpression = [position.lat, position.lng];

  return (
    <div style={{ width: "100%", height, borderRadius: 12, overflow: "hidden" }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ width: "100%", height: "100%" }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={center} icon={markerIcon} />
        <FollowCenter position={position} follow={follow} />
      </MapContainer>
    </div>
  );
}
