#!/bin/bash

# Team setup script for Syllaparse
# Use this if you're working on the same Google Cloud project as other team members

echo "👥 Setting up Syllaparse for team development..."
echo ""

# Check if .env file exists
if [ -f ".env" ]; then
    echo "⚠️  .env file already exists. Backing up to .env.backup"
    cp .env .env.backup
fi

# Create .env file from example
if [ -f ".env.example" ]; then
    cp .env.example .env
    echo "✅ Created .env file from .env.example"
else
    echo "❌ .env.example not found. Please create it first."
    exit 1
fi

# Create credentials directory
mkdir -p credentials

echo ""
echo "📋 Team Setup Instructions:"
echo ""
echo "1. Ask your project admin for the team service account JSON file"
echo "2. Place the JSON file in the 'credentials/' folder"
echo "3. Rename it to 'service-account.json'"
echo "4. Update the .env file with your team's project details:"
echo "   - GOOGLE_CLOUD_PROJECT_ID (your team's project ID)"
echo "   - GOOGLE_CLOUD_BUCKET_NAME (your team's bucket name)"
echo ""
echo "🔐 The credentials directory is already in .gitignore for security"
echo "📁 Your service account file should be at: ./credentials/service-account.json"
echo ""
echo "💡 You can now run: npm run dev (frontend) and python -m uvicorn app.main:app (backend)"
echo ""
echo "📖 For detailed instructions, see TEAM_SETUP.md"
