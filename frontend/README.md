# VACOP Frontend

This directory contains the frontend application for the VACOP project, built with React, TypeScript, and Vite.

## Project Structure

- `VACOP-app/`: The main application source code.

## Development Setup

To run the application locally for development for the 1st time:


docker-compose down --remove-orphans    
docker rm -f vacop_backend || true 
docker-compose up --build



## Run the app

To run the app or restart the app :

docker-compose down

then 

docker-compose up --build

And you can access the app via localhost address on your browser. 