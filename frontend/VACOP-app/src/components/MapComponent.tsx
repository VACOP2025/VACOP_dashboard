import React, { useState, useEffect, useRef } from 'react';
import './MapComponent.css';

// API Base URL (hardcoded for now as per minimal config found)
const API_BASE = 'http://localhost:5000';

export interface MapCoordinates {
  x: number;
  y: number;
  orientation?: { x: number, y: number, z: number, w: number };
  yaw?: number; // Internal use for display
}

interface MapInfo {
  origin_x: number;
  origin_y: number;
  resolution: number;
  width: number;
  height: number;
}

interface MapComponentProps {
  onMapClick: (coords: MapCoordinates) => void;
}

const MapComponent: React.FC<MapComponentProps> = ({ onMapClick }) => {
  const [mapInfo, setMapInfo] = useState<MapInfo | null>(null);
  const [pinPosition, setPinPosition] = useState<{ x: number, y: number, yaw: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const imgRef = useRef<HTMLImageElement>(null);
  const isDragging = useRef(false);
  const startDrag = useRef<{ x: number, y: number } | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/map/info`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load map info');
        return res.json();
      })
      .then(data => {
        setMapInfo(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError("Impossible de charger la carte");
        setLoading(false);
      });
  }, []);

  const getMapCoords = (clientX: number, clientY: number, rect: DOMRect): { mapX: number, mapY: number } | null => {
    if (!mapInfo) return null;

    // Pixel coordinates relative to image (0,0 is top-left)
    const px = clientX - rect.left;
    const py = clientY - rect.top;

    // Check bounds
    if (px < 0 || px > rect.width || py < 0 || py > rect.height) return null;

    // Scale factor if image is resized via CSS
    const scaleX = mapInfo.width / rect.width;
    const scaleY = mapInfo.height / rect.height;

    const realPx = px * scaleX;
    const realPy = py * scaleY;

    // Convert to Map Frame
    // X = origin_x + pixel_x * res
    // Y = origin_y + (height - pixel_y) * res
    const mapX = mapInfo.origin_x + realPx * mapInfo.resolution;
    const mapY = mapInfo.origin_y + (mapInfo.height - realPy) * mapInfo.resolution;

    return { mapX, mapY };
  };

  const yawToQuaternion = (yaw: number) => {
    // simple euler to quat for z-rotation
    const cy = Math.cos(yaw * 0.5);
    const sy = Math.sin(yaw * 0.5);
    return { x: 0.0, y: 0.0, z: sy, w: cy };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mapInfo || !imgRef.current) return;

    isDragging.current = true;
    startDrag.current = { x: e.clientX, y: e.clientY };

    const rect = imgRef.current.getBoundingClientRect();
    const coords = getMapCoords(e.clientX, e.clientY, rect);

    if (coords) {
      // Set initial position with 0 orientation
      const newPos = { x: coords.mapX, y: coords.mapY, yaw: 0 };
      setPinPosition(newPos);

      onMapClick({
        x: newPos.x,
        y: newPos.y,
        orientation: yawToQuaternion(0),
        yaw: 0
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging.current || !startDrag.current || !pinPosition || !imgRef.current) return;

    // Calculate angle
    const dx = e.clientX - startDrag.current.x;
    const dy = e.clientY - startDrag.current.y;
    // Screen Y is down, Map Y is up. Visual angle on screen needs to be mapped to map angle.
    // If I drag UP on screen (negative dy), that should be +Y on map.
    // If I drag RIGHT on screen (positive dx), that should be +X on map.
    // So map_dx = dx, map_dy = -dy.
    const yaw = Math.atan2(-dy, dx);

    setPinPosition(prev => prev ? { ...prev, yaw } : null);

    if (pinPosition) {
      onMapClick({
        x: pinPosition.x,
        y: pinPosition.y,
        orientation: yawToQuaternion(yaw),
        yaw: yaw
      });
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    startDrag.current = null;
  };

  if (loading) return <div className="map-placeholder">Chargement de la carte...</div>;
  if (error) return <div className="map-placeholder error">{error}</div>;

  return (
    <div
      className="map-container"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ position: 'relative', display: 'inline-block', cursor: 'crosshair' }}
    >
      <img
        ref={imgRef}
        src={`${API_BASE}/api/map/image`}
        alt="Occupancy Grid"
        style={{ maxWidth: '100%', height: 'auto', display: 'block', border: '1px solid #333' }}
        draggable={false}
      />

      {pinPosition && imgRef.current && (() => {
        // Convert map coords back to pixel percentage for display
        // realPx = (x - origin_x) / res
        // realPy = height - (y - origin_y) / res
        const realPx = (pinPosition.x - mapInfo!.origin_x) / mapInfo!.resolution;
        const realPy = mapInfo!.height - (pinPosition.y - mapInfo!.origin_y) / mapInfo!.resolution;

        const leftPct = (realPx / mapInfo!.width) * 100;
        const topPct = (realPy / mapInfo!.height) * 100;
        const rotationDeg = -pinPosition.yaw * (180 / Math.PI); // DOM rotation is clockwise (?), Map yaw is CCW.
        // Actually CSS rotate is CW. Yaw is usually CCW from X.
        // Screen X is Right. Screen Y is Down.
        // Atan2(-dy, dx): 0 is Right. 90 is (-dy=1) -> Up.
        // So Yaw 90 deg -> pointing Up.
        // CSS rotate 0 -> Right (if arrow points right).
        // CSS rotate -90 -> Up.
        // So css_angle = -yaw.

        return (
          <div
            className="map-pin"
            style={{
              left: `${leftPct}%`,
              top: `${topPct}%`,
              transform: `translate(-50%, -50%) rotate(${-rotationDeg}deg)`,
              position: 'absolute',
              width: '20px',
              height: '20px',
              // Simple arrow
              borderTop: '5px solid transparent',
              borderBottom: '5px solid transparent',
              borderLeft: '20px solid red'
            }}
          />
        );
      })()}

      <div className='map-info-overlay' style={{
        position: 'absolute', bottom: 5, right: 5, background: 'rgba(0,0,0,0.7)', color: 'white', padding: '5px', fontSize: '10px'
      }}>
        {pinPosition ? `x: ${pinPosition.x.toFixed(2)}, y: ${pinPosition.y.toFixed(2)}, yaw: ${(pinPosition.yaw * 180 / Math.PI).toFixed(0)}°` : "Click to set goal"}
      </div>
    </div>
  );
};

export default MapComponent;