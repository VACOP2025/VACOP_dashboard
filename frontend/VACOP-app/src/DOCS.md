# `src/` — Vue d’ensemble

## Entrée application

- `main.tsx`
  - Point d’entrée React.
  - Monte `<App />` dans `#root`.
  - Importe les CSS globaux (`index.css`) et Leaflet CSS.

- `App.tsx`
  - Définit le routing React Router.
  - Route publique : `/login`.
  - Routes protégées (via `PrivateRoute`) :
    - `/` → MissionPlannerPage
    - `/connect` → ConnectPage
    - `/logs` → LogsDetailedPage
    - `/dashboard` → DashboardPage
    - `/teleoperation` → TeleoperationPage

## Styles / assets

- `index.css` : styles globaux
- `App.css` : styles liés à l’app
- `assets/react.svg` : asset Vite

## Dossiers

- `pages/` : écrans (voir `pages/DOCS.md`)
- `components/` : composants réutilisables (voir `components/DOCS.md`)
- `components/layout/` : layout et guard de routes (voir `components/layout/DOCS.md`)
- `hooks/` : hooks (voir `hooks/DOCS.md`)
- `services/` : services applicatifs (voir `services/DOCS.md`)
