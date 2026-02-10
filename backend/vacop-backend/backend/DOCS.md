# Package `backend/` — Vue d’ensemble

## Point d’entrée

- `app.py`
  - `create_app()` configure Flask, DB, JWT, CORS, Socket.IO et MQTT.
  - Enregistre les blueprints :
    - `/auth` (login)
    - `/vehicle` (missions, abort, logs, goal)
    - `/api/telemetry` (latest/history)
    - `/command` (gamepad)
    - `/api/map` (image/info)
  - Lance l’app via `socketio.run(...)` sur `0.0.0.0:5000`.

## Infrastructure

- `extensions.py`
  - Instances globales : `db`, `jwt`, `bcrypt`, `cors`, `socketio`.
  - `socketio` est configuré avec `async_mode="eventlet"`.

## Modèles (Postgres)

- `models.py`
  - `User` : utilisateurs (username unique, password_hash, role)
  - `Mission` : missions (destination JSON, status, start/end, user_id)
  - `Log` : logs applicatifs (niveau, source, message)
  - `RobotPosition` : positions GNSS persistées (robot_id, ts, lat/lng, topic)

## Seed

- `seed.py` (dans `backend/`)
  - Version simple du seed (sans retry).
  - En Docker, c’est le `seed.py` à la racine du repo backend (un niveau au-dessus) qui est exécuté.

## Dossiers

- `routes/` : endpoints HTTP (voir `routes/DOCS.md`)
- `services/` : services (MQTT, map, cache telemetry) (voir `services/DOCS.md`)
- `utils/` : utilitaires (actuellement vide)
