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
  onMapClick: (goal: MapCoordinates | null, initial: MapCoordinates | null) => void;
}

const MapComponent: React.FC<MapComponentProps> = ({ onMapClick }) => {
  const [mapInfo, setMapInfo] = useState<MapInfo | null>(null);

  // Track both positions
  const [goalPos, setGoalPos] = useState<{ x: number, y: number, yaw: number } | null>(null);
  const [initialPos, setInitialPos] = useState<{ x: number, y: number, yaw: number } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const imgRef = useRef<HTMLImageElement>(null);
  const isDragging = useRef(false);
  const dragTarget = useRef<'goal' | 'initial' | null>(null); // Track which pin is being dragged
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

  const toMapCoords = (pos: { x: number, y: number, yaw: number }): MapCoordinates => ({
    x: pos.x,
    y: pos.y,
    orientation: yawToQuaternion(pos.yaw),
    yaw: pos.yaw
  });

  const updateParent = (goal: typeof goalPos, initial: typeof initialPos) => {
    onMapClick(
      goal ? toMapCoords(goal) : null,
      initial ? toMapCoords(initial) : null
    );
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mapInfo || !imgRef.current) return;

    // Determine target based on button: 0 = Left (Goal), 2 = Right (Initial)
    if (e.button === 0) {
      dragTarget.current = 'goal';
    } else if (e.button === 2) {
      dragTarget.current = 'initial';
    } else {
      return;
    }

    isDragging.current = true;
    startDrag.current = { x: e.clientX, y: e.clientY };

    const rect = imgRef.current.getBoundingClientRect();
    const coords = getMapCoords(e.clientX, e.clientY, rect);

    if (coords) {
      const newPos = { x: coords.mapX, y: coords.mapY, yaw: 0 };

      if (dragTarget.current === 'goal') {
        setGoalPos(newPos);
        updateParent(newPos, initialPos);
      } else {
        setInitialPos(newPos);
        updateParent(goalPos, newPos);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging.current || !startDrag.current || !dragTarget.current || !imgRef.current) return;

    // Calculate angle
    const dx = e.clientX - startDrag.current.x;
    const dy = e.clientY - startDrag.current.y;
    // Screen Y is down, Map Y is up. Visual angle on screen needs to be mapped to map angle.
    // So map_dx = dx, map_dy = -dy.
    const yaw = Math.atan2(-dy, dx);

    if (dragTarget.current === 'goal') {
      setGoalPos(prev => {
        const next = prev ? { ...prev, yaw } : null;
        if (next) updateParent(next, initialPos);
        return next;
      });
    } else {
      setInitialPos(prev => {
        const next = prev ? { ...prev, yaw } : null;
        if (next) updateParent(goalPos, next);
        return next;
      });
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    startDrag.current = null;
    dragTarget.current = null;
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default browser context menu
  };

  const renderPin = (pos: { x: number, y: number, yaw: number }, color: 'red' | 'green') => {
    if (!imgRef.current || !mapInfo) return null;

    const realPx = (pos.x - mapInfo.origin_x) / mapInfo.resolution;
    const realPy = mapInfo.height - (pos.y - mapInfo.origin_y) / mapInfo.resolution;

    const leftPct = (realPx / mapInfo.width) * 100;
    const topPct = (realPy / mapInfo.height) * 100;
    const rotationDeg = -pos.yaw * (180 / Math.PI);

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
          borderTop: '5px solid transparent',
          borderBottom: '5px solid transparent',
          borderLeft: `20px solid ${color}`,
          pointerEvents: 'none' // Let clicks pass through to map
        }}
      />
    );
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
      onContextMenu={handleContextMenu}
      style={{ position: 'relative', display: 'inline-block', cursor: 'crosshair' }}
    >
      <img
        ref={imgRef}
        src={`${API_BASE}/api/map/image`}
        alt="Occupancy Grid"
        style={{ maxWidth: '100%', height: 'auto', display: 'block', border: '1px solid #333' }}
        draggable={false}
      />

      {goalPos && renderPin(goalPos, 'red')}
      {initialPos && renderPin(initialPos, 'green')}

      <div className='map-info-overlay' style={{
        position: 'absolute', bottom: 5, right: 5, background: 'rgba(0,0,0,0.7)', color: 'white', padding: '5px', fontSize: '10px'
      }}>
        Left-click: Goal (Red) | Right-click: Initial (Green)
        {goalPos && <div>Goal: x={goalPos.x.toFixed(2)} y={goalPos.y.toFixed(2)}</div>}
        {initialPos && <div>Init: x={initialPos.x.toFixed(2)} y={initialPos.y.toFixed(2)}</div>}
      </div>
    </div>
  );
};

export default MapComponent;