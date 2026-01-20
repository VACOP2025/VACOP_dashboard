# Étape 1 : Construction de l'app React
FROM node:22-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx vite build

# Étape 2 : Serveur Web (Nginx)
FROM nginx:alpine
# Copie de la config Nginx personnalisée (voir étape 4)
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copie des fichiers construits depuis l'étape 1
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
