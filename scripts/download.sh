#!/bin/bash

# Change the following variables as needed
# OS to download
OS="macos" # macos | ubuntu | windows
# Architecture to download
ARCHITECTURE="aarch64" # aarch64 | x86_64-skylake | x86_64-v2

# GitHub repository
REPO="autonomys/subspace"
TAG="latest" # "tags/gemini-3h-2024-may-06" # Tag of the release to download or "latest" for the latest release

# Directories
DOWNLOAD_DIR="downloads"
EXECUTABLE_DIR="executables"

# Delete the executable directory
rm -r "$EXECUTABLE_DIR"

# Create directories if they do not exist
mkdir -p "$DOWNLOAD_DIR"
mkdir -p "$EXECUTABLE_DIR"

# Get the latest release data
RELEASE_DATA=$(curl -s "https://api.github.com/repos/$REPO/releases/$TAG")

# Extract the download URLs for the selected os and architecture node and farmer assets
NODE_URL=$(echo $RELEASE_DATA | jq -r '.assets[] | select(.name | contains("subspace-node-'$OS'-'$ARCHITECTURE'")) | .browser_download_url')
FARMER_URL=$(echo $RELEASE_DATA | jq -r '.assets[] | select(.name | contains("subspace-farmer-'$OS'-'$ARCHITECTURE'")) | .browser_download_url')

# Download the assets
curl -L -o "$DOWNLOAD_DIR/node.zip" "$NODE_URL"
curl -L -o "$DOWNLOAD_DIR/farmer.zip" "$FARMER_URL"

# Unzip the downloaded files
unzip -o "$DOWNLOAD_DIR/node.zip" -d "$EXECUTABLE_DIR/node_temp"
unzip -o "$DOWNLOAD_DIR/farmer.zip" -d "$EXECUTABLE_DIR/farmer_temp"

# Rename extracted directories to node and farmer
mv "$EXECUTABLE_DIR"/node_temp/* "$EXECUTABLE_DIR/node"
mv "$EXECUTABLE_DIR"/farmer_temp/* "$EXECUTABLE_DIR/farmer"

# Remove temporary directories
rmdir "$EXECUTABLE_DIR/node_temp"
rmdir "$EXECUTABLE_DIR/farmer_temp"

# Clean up zip files
rm "$DOWNLOAD_DIR/node.zip" "$DOWNLOAD_DIR/farmer.zip"

# Make the binaries executable
chmod +X "$EXECUTABLE_DIR/node"
chmod +x "$EXECUTABLE_DIR/farmer"

# Delete the downloads directory
rmdir "$DOWNLOAD_DIR"

echo "Downloaded and unzipped the latest node and farmer assets."