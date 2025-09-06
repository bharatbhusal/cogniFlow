#!/bin/bash

# Stop and remove existing containers
docker compose down

# Build the Docker images
docker compose build

# Start the containers
docker compose up