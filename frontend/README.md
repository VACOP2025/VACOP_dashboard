# VACOP Frontend

This directory contains the frontend application for the VACOP project, built with React, TypeScript, and Vite.

## Project Structure

- `VACOP-app/`: The main application source code.

## Development Setup

To run the application locally for development:

### Prerequisites
- Node.js (v18 or higher recommended)
- npm

### Installation

1. Navigate to the application directory:
   ```bash
   cd VACOP-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Running Locally

Start the development server:
```bash
npm run dev
```
The application will be available at `http://localhost:5173` (or another port if 5173 is busy).

## 🐳 Docker Deployment

You can containerize the application using Docker. The image uses Nginx to serve the production build.

### Build the Image

From the `VACOP-app` directory:

```bash
cd VACOP-app
sudo docker build -t vacop-frontend .
```

### Run the Container

Run the container, mapping port 8080 (host) to port 80 (container):

```bash
sudo docker run -d -p 8080:80 --name vacop-frontend vacop-frontend
```

Access the application at `http://localhost:8080`.

### Stop and Remove

```bash
sudo docker stop vacop-frontend
sudo docker rm vacop-frontend
```
