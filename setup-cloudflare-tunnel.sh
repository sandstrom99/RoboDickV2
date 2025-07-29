#!/bin/bash

# RoboDickV2 Cloudflare Tunnel Setup Script
# Run this on your Mac mini to set up secure public access

set -e

echo "🚀 Setting up Cloudflare Tunnel for RoboDickV2..."

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ This script is designed for macOS. Please install cloudflared manually."
    exit 1
fi

# Install cloudflared
if ! command -v cloudflared &> /dev/null; then
    echo "📦 Installing cloudflared..."
    brew install cloudflared
else
    echo "✅ cloudflared already installed"
fi

# Check if user is logged in
echo "🔐 Checking Cloudflare authentication..."
if ! cloudflared tunnel list &> /dev/null; then
    echo "Please authenticate with Cloudflare first:"
    echo "cloudflared tunnel login"
    exit 1
fi

# Create tunnel
TUNNEL_NAME="robodick-portal"
echo "🌐 Creating tunnel: $TUNNEL_NAME"

if cloudflared tunnel list | grep -q "$TUNNEL_NAME"; then
    echo "✅ Tunnel '$TUNNEL_NAME' already exists"
    TUNNEL_ID=$(cloudflared tunnel list | grep "$TUNNEL_NAME" | awk '{print $1}')
else
    TUNNEL_ID=$(cloudflared tunnel create "$TUNNEL_NAME" | grep -o '[0-9a-f-]\{36\}')
    echo "✅ Created tunnel with ID: $TUNNEL_ID"
fi

# Update config file
echo "📝 Updating tunnel configuration..."
sed -i.bak "s/YOUR_TUNNEL_ID/$TUNNEL_ID/g" cloudflare-tunnel.yml

# Instructions for DNS setup
echo ""
echo "🎯 Next steps:"
echo "1. Set up DNS records in Cloudflare:"
echo "   cloudflared tunnel route dns $TUNNEL_NAME portal.baldersandstrom.com"
echo "   cloudflared tunnel route dns $TUNNEL_NAME api.baldersandstrom.com"
echo "   cloudflared tunnel route dns $TUNNEL_NAME images.baldersandstrom.com"
echo ""
echo "2. Update cloudflare-tunnel.yml with your actual domain"
echo ""
echo "3. Start the tunnel:"
echo "   cloudflared tunnel --config cloudflare-tunnel.yml run"
echo ""
echo "4. Update portal/.env.production with your domains"
echo ""
echo "✅ Setup complete! Your services will be securely accessible worldwide." 