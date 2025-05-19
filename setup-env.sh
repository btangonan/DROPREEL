#!/bin/bash

# Create or overwrite .env.local with the provided values
cat > .env.local << EOL
# Access token (will be auto-refreshed if OAuth is set up)
DROPBOX_ACCESS_TOKEN=$1

# Optional default folder path
DROPBOX_FOLDER_PATH=$2
NEXT_PUBLIC_DROPBOX_FOLDER_PATH=$2

# Dropbox OAuth App credentials
# Get these by creating an app at https://www.dropbox.com/developers/apps
DROPBOX_CLIENT_ID=$3
DROPBOX_CLIENT_SECRET=$4
DROPBOX_REDIRECT_URI=http://localhost:3000/api/auth/dropbox/callback
EOL

echo ".env.local created successfully with your Dropbox configuration."
echo "You can now run 'npm run dev' to start the application."
echo ""
echo "IMPORTANT: For automated token refresh, register a Dropbox app and provide:"
echo "- Client ID: Create an app at https://www.dropbox.com/developers/apps"
echo "- Client Secret: From your Dropbox app settings"
echo "- Redirect URI: http://localhost:3000/api/auth/dropbox/callback (add this to your app)"
