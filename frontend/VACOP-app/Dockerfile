# --- Stage 1: Build ---
# Use an official Node.js runtime as the base image for the build stage
FROM node:18-alpine as build

# Set the working directory inside the container
WORKDIR /app

# Copy package dependency files
COPY package.json package-lock.json ./

# Install dependencies using clean install for reproducibility
RUN npm ci

# Copy the rest of the application source code
COPY . .

# Build the application for production (creates the /dist directory)
RUN npm run build

# --- Stage 2: Web Server (Nginx) ---
# Use a lightweight Nginx image to serve the static files
FROM nginx:alpine

# Copy the build output from the previous stage to the Nginx html directory
COPY --from=build /app/dist /usr/share/nginx/html

# (Optional) Copy custom Nginx configuration to support React Router
# This ensures that page refreshes work correctly with client-side routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 to the outside world
EXPOSE 80

# Start Nginx (this is the default command, but explicit for clarity)
CMD ["nginx", "-g", "daemon off;"]
