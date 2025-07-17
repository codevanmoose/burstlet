#!/bin/bash
# Start script for DigitalOcean deployment

echo "🚀 Starting Burstlet Backend..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm ci --omit=dev
else
  echo "✅ Dependencies already installed"
fi

# Start the server
echo "🏃 Starting server..."
node src/server.js