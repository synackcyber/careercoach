#!/bin/bash

# Goal Tracker Environment Setup Script
# This script helps you set up your environment variables for the Goal Tracker application

echo "🎯 Goal Tracker Environment Setup"
echo "=================================="

# Check if .env already exists
if [ -f ".env" ]; then
    echo "⚠️  .env file already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled. Your existing .env file was not modified."
        exit 0
    fi
fi

# Check if .env.example exists
if [ ! -f ".env.example" ]; then
    echo "❌ .env.example file not found!"
    echo "Please ensure you have the .env.example file in your repository root."
    exit 1
fi

# Copy the example file
cp .env.example .env

echo "✅ Created .env file from .env.example"
echo ""
echo "📝 Next steps:"
echo "1. Edit the .env file with your actual Supabase credentials"
echo "2. Replace the placeholder values:"
echo "   - <YOUR_PROJECT_REF> with your Supabase project reference"
echo "   - <YOUR_SUPABASE_DB_PASSWORD> with your Supabase database password"
echo "   - <YOUR_SUPABASE_ANON_KEY> with your Supabase anonymous key"
echo ""
echo "3. Configure your Supabase Dashboard:"
echo "   - Go to Authentication → Settings"
echo "   - Enable Email OTP and Email providers"
echo "   - Add http://localhost:3000 to Site URL and Redirect URLs"
echo ""
echo "4. Start the application:"
echo "   docker-compose up --build"
echo ""
echo "🔐 Your .env file contains sensitive information - keep it secure and never commit it to version control!"
