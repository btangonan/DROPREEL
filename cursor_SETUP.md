# DropReel - Complete Technical Setup Guide

This document provides detailed instructions for setting up and running the DropReel application, including all necessary dependencies, environment configuration, and common troubleshooting steps.

## System Requirements

- **Node.js**: Version 16.x or later (18.x recommended)
- **npm**: Version 8.x or later
- **Operating System**: macOS, Windows, or Linux

## Initial Setup

### 1. Clone or Extract the Repository

If starting from a zip file:
```bash
unzip dropreel-mvp.zip -d /desired/path
cd /desired/path/dropreel-mvp
```

### 2. Install Dependencies

The application uses several key dependencies:
- Next.js (React framework)
- Dropbox SDK
- Tailwind CSS
- Plyr (video player)
- React Beautiful DND (drag-and-drop)

Install all dependencies:
```bash
npm install --legacy-peer-deps
```

Note: The `--legacy-peer-deps` flag is important as there are some React version conflicts with react-beautiful-dnd that need to be bypassed.

### 3. Environment Configuration

Create a `.env.local` file in the project root with the following variables:

```bash
# Dropbox OAuth App credentials
DROPBOX_CLIENT_ID=your_app_key_here
DROPBOX_CLIENT_SECRET=your_app_secret_here
DROPBOX_REDIRECT_URI=http://localhost:3000/api/auth/dropbox/callback

# Next.js URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

To get these values:
1. Go to [Dropbox Developer Console](https://www.dropbox.com/developers/apps)
2. Create a new app or select your existing app
3. Under "OAuth 2" settings, find your App key (client ID) and App secret
4. In the OAuth 2 redirect URIs section, add: `http://localhost:3000/api/auth/dropbox/callback`

### 4. Starting the Development Server

**IMPORTANT: The application MUST run on port 3000.** The OAuth callback and all API interactions are configured specifically for this port.

Run the application in development mode:
```bash
npm run dev
```

This will start the Next.js development server on port 3000.

If port 3000 is already in use, you must free it before starting the application (see Troubleshooting section). Changing to a different port will break authentication and API functionality.

### 5. Building for Production

To create an optimized production build:
```bash
npm run build
npm start
```

## Dropbox Authentication Flow

The application uses OAuth 2.0 to authenticate with Dropbox:

1. User clicks "Connect to Dropbox" in the UI
2. The app redirects to Dropbox authorization page
3. User approves the connection
4. Dropbox redirects back to the callback URL with an auth code
5. The app exchanges this code for access and refresh tokens
6. Tokens are stored in `.credentials/dropbox_token.json`

Token management is handled automatically with these features:
- Automatic token refreshing when needed
- Token validation before API calls
- Graceful handling of expired tokens

## Key API Endpoints

- `/api/auth/dropbox` - Initiates Dropbox OAuth flow
- `/api/auth/dropbox/callback` - OAuth redirect handler
- `/api/auth/dropbox/status` - Checks authentication status
- `/api/auth/dropbox/refresh` - Manually refreshes the token
- `/api/auth/dropbox/test` - Tests connection health
- `/api/auth/dropbox/reset` - Resets the connection
- `/api/dropbox` - Main API for interacting with Dropbox files

## Troubleshooting

### Stopping the Server/Freeing Port 3000

If you need to kill a process running on port 3000:

**macOS/Linux**:
```bash
# Find the process
lsof -i :3000

# Kill it using the PID
kill -9 <PID>

# Or use this one-liner
pkill -f "next dev"
```

**Windows**:
```bash
# Find the process
netstat -ano | findstr :3000

# Kill it using the PID
taskkill /PID <PID> /F
```

### Common Issues and Solutions

1. **"Failed to start Dropbox authentication" error**:
   - Check that your Dropbox app credentials are correctly set in `.env.local`
   - Verify the redirect URI is correctly added in the Dropbox Developer Console

2. **Node modules errors after updating**:
   - Try cleaning the cache and reinstalling:
   ```bash
   rm -rf node_modules
   npm cache clean --force
   npm install --legacy-peer-deps
   ```

3. **Token-related errors**:
   - Use the reset endpoint to clear stored tokens:
   ```bash
   curl http://localhost:3000/api/auth/dropbox/reset
   ```
   - Then reconnect to Dropbox through the UI

4. **Application hanging during folder browse**:
   - Check connection health:
   ```bash
   curl http://localhost:3000/api/auth/dropbox/test
   ```
   - If status shows issues, reset the connection and reconnect

### Manually Testing API Endpoints

Test connection status:
```bash
curl -s "http://localhost:3000/api/auth/dropbox/test" | json_pp
```

Refresh token:
```bash
curl -s "http://localhost:3000/api/auth/dropbox/refresh" | json_pp
```

## Project Structure

- `/src/components` - React components
- `/src/app` - Next.js app router pages and API routes
- `/src/lib` - Utility functions and shared code
- `/src/app/api` - Backend API endpoints
- `/src/lib/auth` - Authentication-related code
- `/.credentials` - Storage for Dropbox tokens (created at runtime)

## Security Notes

- Access tokens are stored server-side in the `.credentials` directory
- The app uses refresh tokens for long-term access
- Environment variables containing secrets should never be committed to version control
- OAuth is used instead of storing permanent API keys

## Maintenance and Updates

To update the application dependencies:
```bash
npm update
```

To check for security vulnerabilities:
```bash
npm audit
```

## Creating a Backup

To create a full backup of the application:
```bash
# From project root
zip -r dropreel-backup-$(date +%Y-%m-%d_%H-%M).zip . -x "node_modules/*" ".next/*" ".git/*"
```

## Restoring from Backup

To restore from a backup:
```bash
# Extract the backup
unzip dropreel-backup-XXXX-XX-XX_XX-XX.zip -d /desired/path

# Install dependencies
cd /desired/path
npm install --legacy-peer-deps

# Start the app
npm run dev
```
