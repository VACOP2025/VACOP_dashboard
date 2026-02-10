# `services/` — Documentation

## MQTT : `mqtt_service.py`

### Abonnement GNSS

- À la connexion MQTT : abonnement au topic `MQTT_TOPIC` (défaut `robot/gnss`).
- Payload attendu (JSON) :
  - `latitude`, `longitude`, `timestamp` (epoch seconds ou ms, ou ISO string)
  - `robot_id` (optionnel, défaut `robot_1`)
- Conversion : certains devices envoient `lat/lon` en entier *1e7* (le code convertit en degrés).

### Pipeline temps réel

- À chaque message GNSS :
  - construit `{ ts, lat, lng, topic }`
  - met à jour le cache mémoire (`telemetry_state.set_latest_position`)
  - émet Socket.IO : événement `robot:position` vers les clients UI

### Persistance Postgres

- Enregistre une ligne `RobotPosition` en base (table `robot_positions`).
- Pour cela, le module garde une référence Flask via `set_flask_app(app)` (initialisée dans `app.py`).

### Publication de commandes

- `publish_command(command, payload)` publie sur : `${MQTT_COMMAND_BASE}/{command}`
  - Défaut `MQTT_COMMAND_BASE = robot/command`

## Cache telemetry : `telemetry_state.py`

- Stocke en mémoire la “dernière position connue” (thread-safe via lock).
- Utilisé par `GET /api/telemetry/latest`.

## Carte occupancy grid : `map_service.py`

- Lit une DB sqlite RTAB-Map (`Node` + `Data.scan`).
- Décompresse les scans, transforme les points en frame map, puis “rasterize” en grille d’occupation.
- Génère un PNG (via `matplotlib`) : occupé = noir, libre/unknown = blanc.
- Utilisé par les routes `/api/map/info` et `/api/map/image`.
