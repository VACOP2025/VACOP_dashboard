# `routes/` — Documentation des endpoints

Chaque fichier définit un `Blueprint` Flask.

## Auth

- `auth.py` (`/auth`)
  - `POST /auth/login`
    - Body JSON : `{ "username": "...", "password": "..." }`
    - Réponse 200 : `{ access_token, role, username }`
    - Réponse 401 : identifiants invalides

## Mission / véhicule

- `mission.py` (`/vehicle`)
  - `POST /vehicle/mission` (JWT requis + rôle admin)
    - Body JSON : `{ "destination": <JSON> }`
    - Crée une mission DB + publie une commande MQTT (`mission`) + émet `mission_status` via Socket.IO.

  - `POST /vehicle/abort` (JWT requis)
    - Publie une commande MQTT `emergency` (`STOP_IMMEDIATE`).
    - Marque la mission active comme `aborted` si trouvée.

  - `GET /vehicle/logs` (JWT requis)
    - Query : `level` (optionnel), `limit` (défaut 100)
    - Retour : liste de logs DB

  - `POST /vehicle/goal` (pas de JWT)
    - Forward le payload JSON vers MQTT sur le topic `/goal` (publication directe).

## Telemetry

- `telemetry.py` (`/api/telemetry`)
  - `GET /api/telemetry/latest`
    - Retourne la dernière position connue.
    - Priorité : cache mémoire (alimenté par MQTT) puis fallback DB.

  - `GET /api/telemetry/history`
    - Query : `robot_id` (défaut `robot_1`), `limit` (défaut 200), `since_ms`, `until_ms`.
    - Retourne une liste chronologique de positions (oldest → newest).

## Gamepad

- `gamepad.py` (`/command`)
  - `POST /command/gamepad`
    - Reçoit l’état de la manette (payload JSON) et publie sur MQTT.
    - Topic : `${MQTT_COMMAND_BASE}/gamepad` (défaut `robot/command/gamepad`).
    - Transforme le payload en vecteur `{ throttle, steering, brake }` (deadzone + inversion axe Y).

## Map (occupancy grid)

- `map.py` (`/api/map`)
  - `GET /api/map/info`
    - Retourne les métadonnées : origin, resolution, width/height.

  - `GET /api/map/image`
    - Retourne un PNG `map_occupancy.png` généré depuis une DB RTAB-Map.

  - Dépend de : `DB_PATH` (env) ou fallback vers `backend/instance/rtabmap_26_02_1.db`.
