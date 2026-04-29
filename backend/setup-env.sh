#!/bin/bash

# Setup script for CRM Arrighi Backend Environment

echo "🚀 Setting up CRM Arrighi Backend Environment..."
echo ""

# Check if .env already exists
if [ -f ".env" ]; then
    echo "⚠️  .env file already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Setup cancelled."
        exit 1
    fi
fi

# Copy .env.example to .env
if [ -f ".env.example" ]; then
    cp .env.example .env
    echo "✅ Created .env file from .env.example"
else
    echo "❌ .env.example not found!"
    exit 1
fi

# Check if appsettings.json exists
if [ -f "appsettings.json" ]; then
    echo "⚠️  appsettings.json already exists!"
    read -p "Do you want to create a backup? (Y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        cp appsettings.json "appsettings.json.backup.$(date +%Y%m%d_%H%M%S)"
        echo "✅ Created backup of appsettings.json"
    fi
else
    # Copy appsettings.json.example to appsettings.json
    if [ -f "appsettings.json.example" ]; then
        cp appsettings.json.example appsettings.json
        echo "✅ Created appsettings.json from appsettings.json.example"
    else
        echo "⚠️  appsettings.json.example not found!"
    fi
fi

echo ""
echo "📝 Next steps:"
echo "1. Edit .env file with your configuration values"
echo "2. Edit appsettings.json with your configuration values"
echo "3. Run 'dotnet restore' to restore packages"
echo "4. Run 'dotnet run' to start the application"
echo ""
echo "📖 For more information, see ENV_SETUP.md"
echo ""
echo "✅ Setup complete!"
