# `pages/` — Documentation des écrans

Ce dossier contient les pages routées depuis `App.tsx`.

## Login

- `LoginPage.tsx`
  - Formulaire username/password.
  - Appelle `authService.login()` puis navigue vers `/` en cas de succès.
  - Affiche une erreur si `authService.login()` lève une exception.
- `LoginPage.css`
  - Styles du formulaire.

## Mission planner

- `MissionPlannerPage.tsx`
  - Page principale après login (route `/`).
  - Utilise `MapComponent` pour sélectionner une destination (clic + orientation via drag).
  - Bouton “Lancer la mission” :
    - Construit un payload `{ pose: { header, pose { position, orientation } }, behavior_tree: '' }`
    - POST vers `http://localhost:5000/vehicle/goal`
    - Ajoute un header `Authorization: Bearer <token>` (token venant de `authService.getCurrentUserToken()`).
  - Bouton “Planifier la mission” : validation date/heure uniquement (pas d’appel API dans l’état actuel).
  - Boutons / liens : téléop (`/teleoperation`), logs (`/logs`), connexion (`/connect`), logout.
- `MissionPlannerPage.css`
  - Layout en grille + styles des boutons.

## Dashboard (mission automatique)

- `DashboardPage.tsx`
  - Route `/dashboard`.
  - UI 3 colonnes : `LogsPanel`, 2x `VideoFeed`, `ObstacleDisplay`, `StaticMap`.
  - Utilise `useGamepadStatus(true)` pour détecter une manette.
  - “Abandon mission” : confirmation puis navigation vers `/`.
- `DashboardPage.css`
  - Styles de la grille dashboard.

## Téléopération

- `TeleoperationPage.tsx`
  - Route `/teleoperation`.
  - UI similaire au dashboard.
  - Utilise :
    - `useGamepadStatus(true)` pour détecter une manette.
    - `useGamepadDebug(isConnected, 20)` pour loguer les changements d’input.
    - `useGamepadTransmit(isConnected, { endpointUrl: 'http://localhost:5000/command/gamepad', pollHz: 20 })` pour poster l’état de la manette.
  - “Changer de mode” et “Abandon mission” appellent le même handler (retour au planner).
- `TeleoperationPage.css`
  - Styles de la grille téléop.

## Connexion VACOP

- `ConnectPage.tsx`
  - Route `/connect`.
  - Formulaire IP + port (valeurs par défaut dans le state).
  - Comportement actuel : alerte “Connexion (simulée) réussie!” puis retour `/`.
- `ConnectPage.css`
  - Styles du formulaire.

## Logs détaillés

- `LogsDetailedPage.tsx`
  - Route `/logs`.
  - Liste scrollable de logs statiques (`fakeDetailedLogs`), sans appel API.
- `LogsDetailedPage.css`
  - Styles de la page de logs.
