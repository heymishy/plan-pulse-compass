#!/bin/bash

# Vercel build script to handle npm ci compatibility
echo "🔍 Checking npm and package-lock.json compatibility..."

# Check npm version
NPM_VERSION=$(npm --version)
echo "📦 npm version: $NPM_VERSION"

# Check lockfileVersion
LOCKFILE_VERSION=$(node -e "console.log(JSON.parse(require('fs').readFileSync('package-lock.json', 'utf8')).lockfileVersion)")
echo "🔒 lockfileVersion: $LOCKFILE_VERSION"

# If lockfileVersion is 3 and npm < 7, use npm install instead of npm ci
if [ "$LOCKFILE_VERSION" -eq 3 ] && [ "$(echo $NPM_VERSION | cut -d. -f1)" -lt 7 ]; then
    echo "⚠️  npm ci not compatible with lockfileVersion 3, using npm install"
    npm install
else
    echo "✅ Using npm ci for clean install"
    npm ci
fi

# Run the build
echo "🏗️  Starting build process..."
npm run build