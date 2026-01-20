import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import L from "leaflet";

type LatLng = { lat: number; lng: number };

type RobotMapProps = {
  position: LatLng;
  zoom?: number;
  follow?: boolean;
  height?: number | string;
};

// Fix icône Leaflet (souvent cassée avec bundlers)
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
    map.setView([position.lat, position.lng], map.getZoom(), { animate: true });
  }, [position.lat, position.lng, follow, map]);

  return null;
}

export function RobotMap({
  position,
  zoom = 18,
  follow = true,
  height = 420,
}: RobotMapProps) {
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
          // Tiles OSM officielles (OK pour dev). Pour prod/fort trafic, prends un provider dédié.
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker position={center} icon={markerIcon} />
        <FollowCenter position={position} follow={follow} />
      </MapContainer>
    </div>
  );
}
