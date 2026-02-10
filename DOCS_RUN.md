# VACOP Dashboard — Guide d’exécution (Windows + Linux)

Ce document explique comment lancer l’application (frontend + backend + DB + MQTT) avec Docker Compose, et donne quelques repères utiles pour comprendre le comportement côté UI.

## Prérequis

### Windows

- Docker Desktop installé
- Docker Desktop démarré (l’icône Docker doit indiquer que le daemon tourne)
- (Optionnel) Git, si vous mettez à jour via `git pull`

### Linux

- Docker Engine installé
- Docker Compose (plugin) disponible via la commande `docker compose`
- Votre utilisateur a le droit d’utiliser Docker (sinon, utiliser `sudo`)

## Démarrage rapide (Docker Compose)

Depuis la racine du projet `VACOP_Dashboard/` :

```bash
docker compose up --build
```

Sur Linux, si votre utilisateur n’a pas les droits Docker, utilisez :

```bash
sudo docker compose up --build
```

- UI: http://localhost/
- Backend: http://localhost:5000/

Pour lancer en arrière-plan :

```bash
docker compose up -d --build
```

(Linux sans droits Docker : `sudo docker compose up -d --build`)

Pour arrêter :

```bash
docker compose down
```

(Linux sans droits Docker : `sudo docker compose down`)

Pour supprimer aussi les volumes (reset DB) :

```bash
docker compose down -v
```

(Linux sans droits Docker : `sudo docker compose down -v`)

## Vérifier l’état / voir les logs

- Vérifier que le daemon Docker tourne :

```bash
docker info
```

- Vérifier les services Compose :

```bash
docker compose ps
```

- Suivre les logs :

```bash
docker compose logs -f
```

## Linux (legacy) : `docker-compose` + `sudo`

Certains environnements Linux utilisent encore l’ancienne commande `docker-compose` (binaire séparé) et l’usage systématique de `sudo`.

### “1st time” (procédure legacy)

```bash
sudo docker-compose down --remove-orphans

sudo docker rm -f vacop_backend || true

sudo docker-compose up --build
```

### Restart (procédure legacy)

```bash
sudo docker-compose down
sudo docker-compose up --build
```

### Équivalent moderne recommandé

```bash
docker compose down --remove-orphans
docker compose up --build
```

Si vous n’avez pas les droits Docker sous Linux :

```bash
sudo docker compose down --remove-orphans
sudo docker compose up --build
```

Note : `|| true` est une syntaxe shell (bash). Elle n’est pas portable (ex: PowerShell Windows). Dans la pratique, `docker compose down --remove-orphans` suffit généralement.

## Services / Ports

- `frontend` (Nginx) : `80:80` → http://localhost/
- `backend` (Flask) : `5000:5000` → http://localhost:5000/
- `db` (PostgreSQL) : exposé uniquement au réseau Docker (pas de port host par défaut)
- `mqtt` (Mosquitto) : `1883:1883` (MQTT) et `9001:9001` (WebSocket)

## Authentification (important)

- Le frontend stocke un token dans `localStorage` sous la clé `user_token`.
- Dans l’état actuel, le login côté UI est simulé : la fonction `login()` met un token factice et retourne `true`.
- Le backend possède une vraie route d’auth (`/auth/login`), mais elle n’est pas utilisée par défaut côté UI.

Admin seedé dans la DB au démarrage du backend :
- username: `admin`
- password: `vacop_admin_2026`

## Carte / Occupancy grid (Mission planner)

La carte interactive de planification consomme :
- `GET /api/map/info`
- `GET /api/map/image`

Ces endpoints génèrent un PNG à partir d’une base RTAB-Map.
Le backend utilise la variable d’environnement `DB_PATH` (dans `docker-compose.yml`) et une montée de volume :
- Host: `backend/instance/` → Container: `/app/instance/`
- Attendu: `backend/instance/rtabmap_26_02_1.db`

Si le fichier DB n’existe pas, l’API map renverra une erreur (404) et la carte ne chargera pas.

## MQTT (note de configuration)

Dans `docker-compose.yml`, le backend est configuré avec un broker MQTT distant (`neocampus.univ-tlse3.fr:10883`).
En parallèle, un container Mosquitto local est aussi lancé (`mqtt`).

Conséquence: si le broker distant n’est pas accessible, certaines fonctionnalités MQTT peuvent ne pas fonctionner même si le container Mosquitto local tourne.

## Dépannage rapide

### Warning : `version` is obsolete (docker-compose.yml)
- Ce warning est courant : le champ `version:` est ignoré par les versions récentes de Compose.
- Vous pouvez l’ignorer : il ne bloque pas l’exécution.

### Erreur “pipe dockerDesktopLinuxEngine … not found”
- Docker Desktop n’est probablement pas démarré.
- Démarrez Docker Desktop puis relancez la commande `docker compose ...`.

### Linux : “Cannot connect to the Docker daemon”
- Le daemon Docker n’est pas démarré, ou vous n’avez pas les droits.
- Essayez : `sudo docker compose up --build`.
- Vérifiez que Docker tourne (selon distro) : `sudo systemctl status docker`.

### Commande `docker` introuvable
- Fermez et rouvrez le terminal (PATH non rafraîchi après installation).

### Linux : `docker compose` introuvable
- Votre système utilise peut-être l’ancienne commande `docker-compose` (binaire séparé).
- Idéalement, installez le plugin Compose pour avoir `docker compose`.
- En dernier recours (si disponible) : `docker-compose up --build`.

### Conflit de ports (80 ou 5000 déjà utilisés)
- Arrêtez le service qui occupe le port, ou modifiez les ports du compose.

### Rebuild propre
```bash
docker compose down
docker compose build --no-cache
docker compose up
```
