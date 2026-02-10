# VACOP-app (React + Vite) — Documentation

## Stack

- React + TypeScript + Vite
- React Router
- Leaflet / React-Leaflet (cartographie)
- Socket.IO client (télémétrie temps réel)

## Scripts (package.json)

- `npm run dev` : serveur Vite (développement local)
- `npm run build` : build TypeScript + Vite
- `npm run preview` : preview du build

## Exécution

### Mode Docker (recommandé pour ce repo)
Le frontend est servi par Nginx dans le container `frontend` (compose). Accès: http://localhost/

Le fichier `nginx.conf` proxy les routes suivantes vers le backend (container `backend:5000`) :
- `/auth/*`
- `/vehicle/*`
- `/socket.io/*`

### Mode local (hors Docker)
Possible via Vite (`npm install` puis `npm run dev`), mais attention : certaines pages utilisent des URLs hardcodées vers `http://localhost:5000`.

## Structure

- `src/` : code de l’interface (voir `src/DOCS.md`)
- `nginx.conf` : config Nginx (SPA + reverse proxy)
