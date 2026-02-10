# `components/` — Documentation des composants

## Status / UI

- `ConnectionStatus.tsx`
  - Bouton d’état (connecté/déconnecté) pour `gamepad` ou `robot`.
  - Icônes via `react-icons` (gamepad/wifi + slash en cas de déconnexion).
- `ConnectionStatus.css`
  - Styles du bouton + overlay du slash.

- `LogsPanel.tsx`
  - Panneau “Logs importants” basé sur une liste statique `fakeLogs`.
- `LogsPanel.css`
  - Styles du panneau et des niveaux (info/warn/error).

- `VideoFeed.tsx`
  - Placeholder d’un flux vidéo (titre + zone noire).
- `VideoFeed.css`
  - Styles du placeholder.

- `ObstacleDisplay.tsx`
  - Placeholder d’une visualisation d’obstacles.
- `ObstacleDisplay.css`
  - Styles du placeholder.

## Cartographie

- `RobotMap.tsx`
  - Carte Leaflet (tuile OSM) + Marker + Polyline (trajectoire).
  - Chargement initial :
    - `GET {backendUrl}/api/telemetry/latest`
    - `GET {backendUrl}/api/telemetry/history?robot_id=robot_1&since_ms=...&limit=...`
  - Temps réel : connexion Socket.IO sur `{backendUrl}` et écoute de l’événement `robot:position`.
  - Options : `backendUrl`, `zoom`, `follow`, `height`.

- `StaticMap.tsx`
  - Composant “démo” qui rend `RobotMap`.
  - Important : le fichier exporte `default function Demo()` mais il est importé sous le nom `StaticMap` dans les pages.
  - Le state local `position` est affiché mais n’est pas passé à `RobotMap` (actuellement la carte vit “en autonome” via backend/socket).

- `MapComponent.tsx`
  - Carte “occupancy grid” (image) utilisée dans le mission planner.
  - Consomme :
    - `GET http://localhost:5000/api/map/info`
    - `GET http://localhost:5000/api/map/image`
  - Interaction : clic = position (x,y), drag = orientation (yaw), conversion yaw→quaternion.
- `MapComponent.css`
  - Styles du container + pin + overlay.
