#!/bin/bash

# Kill any processes running on our target ports
echo "Stopping any existing servers..."
lsof -ti:3000,3001,3002,3003 | xargs kill -9 2>/dev/null || true

# Make sure port 3000 is free
echo "Making sure port 3000 is free..."
npx kill-port 3000 2>/dev/null || true

# Start the app explicitly on port 3000
echo "Starting DropReel on port 3000..."
PORT=3000 npm run dev
