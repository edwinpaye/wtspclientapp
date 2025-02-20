#!/bin/bash

set -e  # Exit immediately if a command exits with a non-zero status

# --- Configuration ---

CHROME_DEPENDENCIES_FILE="Dockerfile.1chrome-dependencies"
CHROME_DEPENDENCIES_IMAGE="1chrome-dependencies"
NODE_DEPENDENCIES_FILE="Dockerfile.2node-dependencies"
NODE_DEPENDENCIES_IMAGE="2node-dependencies"
PROJECT_FILE="Dockerfile.3project"
PROJECT_IMAGE="chat-bot"

# --- Functions ---

# Function to build a Docker image
build_image() {
  local dockerfile=$1
  local image_name=$2

  echo "Building Docker image: $image_name (using $dockerfile)"

  docker build -f "$dockerfile" -t "$image_name" .

  if [ $? -ne 0 ]; then
    echo "ERROR: Failed to build Docker image: $image_name"
    exit 1  # Exit the script on failure
  fi

  echo "Successfully built Docker image: $image_name"
}

# --- Main Script ---

echo "Starting Docker image build process..."

build_image "$CHROME_DEPENDENCIES_FILE" "$CHROME_DEPENDENCIES_IMAGE"

build_image "$NODE_DEPENDENCIES_FILE" "$NODE_DEPENDENCIES_IMAGE"

build_image "$PROJECT_FILE" "$PROJECT_IMAGE"

echo "Docker image build process completed successfully!"

exit 0

# docker run -p 3000:3000 --env-file configs/prod.env --name chat-bot "$PROJECT_IMAGE"
