# VACOP - Véhicule Autonome Connecté Open-Source et Plug & Play



Le projet **VACOP** (Véhicule Autonome Connecté Open-Source et Plug & Play) vise à développer une plateforme de navigation autonome et connectée sur le campus autOCampus (IRIT). L'objectif est de permettre au véhicule de naviguer de manière sécurisée dans un environnement contrôlé, tout en assurant une supervision et un contrôle en temps réel via une interface web dédiée et une infrastructure 5G privée.

Ce projet s'inscrit dans le cadre des activités de recherche et d'expérimentation en mobilité autonome de l'IRIT et de la promotion SRI 2026.

---

## Fonctionnalités Principales

Le système VACOP est conçu autour de quatre modules principaux :

* **Localisation et Estimation:**
    * Géolocalisation centimétrique (2-3 cm) grâce à un récepteur GNSS RTK (u-blox ZED-F9P).
    * Fusion de données robuste (Filtre de Kalman Étendu) combinant le GNSS et l'odométrie (capteurs à effet Hall) pour maintenir la position même en cas de perte de signal.

* **Perception et Compréhension de l'Environnement:**
    * Cartographie SLAM et localisation continue à l'aide d'un LiDAR 3D (Robosense Helios 16P).
    * Détection et classification d'obstacles statiques et dynamiques (piétons, véhicules) par fusion de données LiDAR et caméras (RGB & RGB-D).
    * Génération d'une carte de coûts dynamique pour la navigation.

* **Planification de Trajectoire (Path Planning):**
    * Planification globale pour calculer l'itinéraire optimal vers un objectif.
    * Planification locale pour l'évitement d'obstacles en temps réel et l'adaptation aux risques (collisions, piétons).
    * Contrôle en boucle fermée des actionneurs (moteurs, direction, freinage).

* **Communication et Supervision (IHM):**
    * Interface de supervision web (React / Flask) pour le contrôle et la visualisation à distance.
    * **Mode Automatique :** Planification de missions (instantanées ou différées) en sélectionnant une destination sur la carte.
    * **Mode Téléopération :** Contrôle manuel à distance du véhicule via une manette.
    * **Visualisation Temps Réel :** Affichage des flux vidéo, de la position du véhicule, des logs et de la carte des obstacles.

---

## Architecture Système

L'architecture est construite sur **ROS2** et s'articule autour de trois pôles principaux, connectés via un réseau 5G privé.



1.  **Véhicule (Embarqué):**
    * **Calculateur principal :** NVIDIA Jetson Orin NX pour la fusion de capteurs, la perception et la planification.
    * **Capteurs :** LiDAR, Caméras RGB/RGB-D, GNSS RTK, Capteurs à effet Hall (odométrie).
    * **Communication :** Module Telit 5G pour la télémétrie et les corrections NTRIP.
    * **Contrôle bas niveau :** Raspberry Pi et contrôleurs moteurs SOLO MEGA.

2.  **Serveurs (IRIT):**
    * **Backend (C2) :** Une application **Flask** gérant la logique métier, l'API REST, les WebSockets pour les données temps réel et l'authentification.
    * **Base de données (C2) :** **PostgreSQL** pour le stockage des utilisateurs, des missions et de l'historique des logs.
    * **Déploiement :** L'ensemble de la supervision (C1+C2) est conteneurisé avec **Docker**.

3.  **Client (Opérateur):**
    * **Frontend (C1) :** Une interface web **React** sécurisée (HTTPS) permettant à l'opérateur de superviser et contrôler le véhicule.
    * **Protocoles :** HTTPS, WebSocket, WebRTC (pour la vidéo).





