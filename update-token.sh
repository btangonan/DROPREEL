#!/bin/bash

# This script updates only the Dropbox access token in .env.local file
# Usage: ./update-token.sh "YOUR_NEW_TOKEN"

if [ -z "$1" ]; then
  echo "Error: No token provided"
  echo "Usage: ./update-token.sh \"YOUR_NEW_TOKEN\""
  exit 1
fi

NEW_TOKEN="$1"

# Get the current folder path from .env.local
FOLDER_PATH=$(grep DROPBOX_FOLDER_PATH .env.local | head -1 | cut -d= -f2-)

# If folder path not found, use default
if [ -z "$FOLDER_PATH" ]; then
  FOLDER_PATH="/Tangonan_Cousins_NFPA"
fi

# Create new .env.local with the new token but same folder path
cat > .env.local << EOL
DROPBOX_ACCESS_TOKEN=$NEW_TOKEN
DROPBOX_FOLDER_PATH=$FOLDER_PATH
NEXT_PUBLIC_DROPBOX_FOLDER_PATH=$FOLDER_PATH
EOL

echo "Token updated successfully!"
echo "Folder path is set to: $FOLDER_PATH"
echo "You can now run 'npm run dev --port 4000' to start the application."
