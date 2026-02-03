import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import L from "leaflet";
import { io, type Socket } from "socket.io-client";

type LatLng = { lat: number; lng: number };
type BackendPos = { ts: number | string; lat: number; lng: number; topic?: string };

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

function FitBoundsOnce({ track }: { track: [number, number][] }) {
  const map = useMap();
  const didFit = useRef(false);

  useEffect(() => {
    if (didFit.current) return;
    if (track.length < 2) return;

    // Fit map to the trajectory bounds once, then lock.
    const bounds = L.latLngBounds(track.map((p) => L.latLng(p[0], p[1])));
    map.fitBounds(bounds, { padding: [20, 20] });

    didFit.current = true;
  }, [track, map]);

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

  // Store the trajectory as an ordered list of [lat, lng] points.
  const [track, setTrack] = useState<[number, number][]>([]);

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
          console.debug("[Map] latest position:", p.lat, p.lng, "ts=", p.ts);
        }
      })
      .catch(() => {
        // Ignore: API might be unavailable at first load.
      });

    // 1b) Load recent history for the polyline (last 10 minutes).
    const loadHistory = async () => {
      const sinceMs = Date.now() - 10 * 60 * 1000; // last 10 minutes
      const url = `${baseUrl}/api/telemetry/history?robot_id=robot_1&since_ms=${sinceMs}&limit=5000`;

      console.debug("[Map] fetching history:", url);

      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) {
        throw new Error(`History fetch failed: ${res.status} ${res.statusText}`);
      }

      const rows: Array<{ lat: number; lng: number; ts: string | number }> = await res.json();

      const pts: [number, number][] = rows
        .filter((r) => typeof r.lat === "number" && typeof r.lng === "number")
        .map((r) => [r.lat, r.lng]);

      console.debug("[Map] history loaded points:", pts.length);

      setTrack(pts);

      // If history exists, sync marker to the last known historical point.
      if (pts.length > 0) {
        const last = pts[pts.length - 1];
        setPosition({ lat: last[0], lng: last[1] });
      }
    };

    loadHistory().catch((err) => console.error("[Map] loadHistory error:", err));

    // 2) Live updates via Socket.IO.
    const socket = io(baseUrl, {
      path: "/socket.io",
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 3000,
      timeout: 8000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.debug("[socket.io] connected:", socket.id, "transport:", socket.io.engine.transport.name);
    });

    socket.on("connect_error", (err) => {
      console.debug("[socket.io] connect_error:", err?.message ?? err);
    });

    socket.io.on("reconnect_attempt", (attempt) => {
      console.debug("[socket.io] reconnect_attempt:", attempt);
    });

    socket.on("robot:position", (p: BackendPos) => {
      if (p?.lat == null || p?.lng == null) return;

      const next: [number, number] = [p.lat, p.lng];

      // Update marker.
      setPosition({ lat: p.lat, lng: p.lng });

      // Append to trajectory (with a minimal anti-duplicate guard + periodic debug log).
      setTrack((prev) => {
        const last = prev.length > 0 ? prev[prev.length - 1] : null;
        if (last && last[0] === next[0] && last[1] === next[1]) return prev;

        const updated = [...prev, next];
        if (updated.length % 20 === 0) {
          console.debug("[Map] track length:", updated.length);
        }
        return updated;
      });

      console.debug("[Map] live position:", next, "ts=", p.ts);
    });

    return () => {
      controller.abort();

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
      <MapContainer center={center} zoom={zoom} style={{ width: "100%", height: "100%" }} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Fit the view to the trajectory once the history is loaded */}
        <FitBoundsOnce track={track} />

        {/* Render the trajectory */}
        {track.length >= 2 && <Polyline positions={track} pathOptions={{ color: "blue", weight: 4, opacity: 0.8 }} />}

        {/* Render the latest known position */}
        <Marker position={center} icon={markerIcon} />

        <FollowCenter position={position} follow={follow} />
      </MapContainer>
    </div>
  );
}
