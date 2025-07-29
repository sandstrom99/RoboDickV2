#!/bin/bash

# RoboDickV2 Cloudflare Tunnel Setup (No Domain Required)
# This uses Cloudflare's free *.trycloudflare.com subdomains

set -e

echo "🚀 Setting up Cloudflare Tunnel with free subdomains..."

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

echo ""
echo "🌐 Starting tunnels with free subdomains..."
echo ""
echo "📝 You'll need to run these commands in separate terminals:"
echo ""
echo "Terminal 1 (Image Service):"
echo "cd image-service && npm run dev"
echo ""
echo "Terminal 2 (Portal):"
echo "cd portal && npm run dev"
echo ""
echo "Terminal 3 (Tunnel for API):"
echo "cloudflared tunnel --url localhost:3000"
echo ""
echo "Terminal 4 (Tunnel for Portal):"
echo "cloudflared tunnel --url localhost:5173"
echo ""
echo "⚡ Quick Start Script:"
cat << 'EOF' > start-tunnels.sh
#!/bin/bash
echo "Starting all services..."

# Start image service in background
cd image-service && npm run dev &
IMAGE_PID=$!

# Wait for image service to start
sleep 3

# Start portal in background  
cd ../portal && npm run dev &
PORTAL_PID=$!

# Wait for portal to start
sleep 3

# Start tunnels
echo "Starting Cloudflare tunnels..."
cloudflared tunnel --url localhost:3000 &
API_TUNNEL_PID=$!

cloudflared tunnel --url localhost:5173 &
PORTAL_TUNNEL_PID=$!

echo ""
echo "✅ All services started!"
echo "🔗 Check the terminal output above for your public URLs"
echo ""
echo "To stop all services, press Ctrl+C"

# Wait for user to stop
wait
EOF

chmod +x start-tunnels.sh

echo ""
echo "🎯 Next steps:"
echo "1. Run: ./start-tunnels.sh"
echo "2. Look for URLs like: https://random-name.trycloudflare.com"
echo "3. Update portal/.env with the tunnel URLs:"
echo "   VITE_API_URL=https://your-api-tunnel.trycloudflare.com"
echo "   VITE_IMAGE_URL=https://your-api-tunnel.trycloudflare.com"
echo "4. Restart the portal (npm run dev) after updating .env"
echo "5. Access your portal via the portal tunnel URL"
echo ""
echo "💡 Note: The portal vite.config.ts has been configured to allow Cloudflare tunnel hosts"
echo "✅ No domain required! Your services will be accessible worldwide." 