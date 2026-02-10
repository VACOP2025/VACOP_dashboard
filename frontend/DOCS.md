# Frontend — Documentation

Le frontend du projet est dans `frontend/VACOP-app/`.

- En Docker, il est buildé via le Dockerfile de `frontend/VACOP-app/` puis servi par Nginx (port 80).
- Nginx reverse-proxy certaines routes vers le backend : `/auth`, `/vehicle`, `/socket.io`.

Voir aussi :
- `frontend/VACOP-app/DOCS.md` pour les scripts et dépendances
- `frontend/VACOP-app/src/**/DOCS.md` pour la documentation de l’interface (pages, composants, hooks, services)
