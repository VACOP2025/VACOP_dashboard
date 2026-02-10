# Backend — Vue d’ensemble

Le backend applicatif Flask est dans `backend/vacop-backend/`.

## Dossiers

- `vacop-backend/`
  - Projet Python du backend (Dockerfile, requirements, seed, package `backend/`).
- `instance/`
  - Données utilisées par l’app (ex: DB RTAB-Map `.db`, fichiers générés).
  - En Docker, ce dossier est monté dans le container backend sur `/app/instance`.
- `setup.sh`
  - Script Bash historique de scaffolding (génération de fichiers). Non nécessaire pour exécuter le projet via Docker Compose.
- `venv/`
  - Environnement Python local (si présent). Non utilisé par Docker.

## Exécution

Pour lancer l’app (frontend + backend + db + mqtt), voir le guide principal :
- [VACOP_Dashboard/DOCS_RUN.md](../DOCS_RUN.md)
