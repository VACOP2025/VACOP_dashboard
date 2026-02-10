# vacop-backend — Documentation

## Rôle

Service backend Flask qui fournit :
- API HTTP (auth, missions, logs, telemetry, map, gamepad)
- Socket.IO (temps réel) vers l’UI
- Intégration MQTT (abonnement GNSS + publication commandes)
- Persistance Postgres (missions, logs, positions)

## Fichiers principaux

- `Dockerfile`
  - Image `python:3.10-slim`
  - Installe `gcc` + `libpq-dev` (pour psycopg2)
  - Lance `python seed.py && python -m backend.app`

- `requirements.txt`
  - Dépendances Flask + SQLAlchemy + JWT + Socket.IO (eventlet) + MQTT + matplotlib/numpy.

- `seed.py`
  - Script de seed exécuté au démarrage du container.
  - Crée les tables (`db.create_all()`) et crée un utilisateur admin si absent.
  - Identifiants seedés : username `admin`, password `vacop_admin_2026`.

## Variables d’environnement (Docker Compose)

Principales variables consommées par `backend/app.py` et certains modules :

- `DATABASE_URL` : chaîne SQLAlchemy Postgres (ex: `postgresql://user:pass@db:5432/vacop_db`)
- `SECRET_KEY` : secret Flask

MQTT :
- `MQTT_BROKER_URL`
- `MQTT_BROKER_PORT`
- `MQTT_USERNAME` / `MQTT_PASSWORD` (optionnels)
- `MQTT_TOPIC` : topic GNSS (abonnement)
- `MQTT_COMMAND_BASE` : préfixe des commandes MQTT (ex: `robot/command`)

Carte / RTAB-Map :
- `DB_PATH` : chemin vers la DB RTAB-Map (sqlite) utilisée pour générer la carte occupancy grid.

Note : `JWT_SECRET_KEY` est défini en dur dans le code (pas via env).

## Structure du package

- `backend/` : code Python (voir `backend/DOCS.md`)
