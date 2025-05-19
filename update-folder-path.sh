#!/bin/bash

# Script to update only the folder path in .env.local without changing the access token
# Usage: ./update-folder-path.sh "/Your/Folder/Path"

# Check if .env.local exists
if [ ! -f .env.local ]; then
  echo "Error: .env.local file not found. Please run setup-env.sh first."
  exit 1
fi

# Get current token from .env.local
CURRENT_TOKEN=$(grep DROPBOX_ACCESS_TOKEN .env.local | cut -d= -f2-)

# Error if token not found
if [ -z "$CURRENT_TOKEN" ]; then
  echo "Error: No access token found in .env.local. Please run setup-env.sh first."
  exit 1
fi

# Get the new folder path from argument
NEW_PATH="$1"

# Create new .env.local with updated path but same token
cat > .env.local << EOL
DROPBOX_ACCESS_TOKEN=$CURRENT_TOKEN
DROPBOX_FOLDER_PATH=$NEW_PATH
NEXT_PUBLIC_DROPBOX_FOLDER_PATH=$NEW_PATH
EOL

echo "Folder path updated to: $NEW_PATH"
echo "The access token remains unchanged."
echo "You can now run 'npm run dev' to start the application."
