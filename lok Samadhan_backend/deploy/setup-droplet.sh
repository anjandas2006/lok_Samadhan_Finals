#!/usr/bin/env bash
# =========================================================================
# Lok Samadhan - Automated DigitalOcean Ubuntu Droplet Setup Script
# Run on fresh Ubuntu 22.04 / 24.04 LTS Droplet:
#   chmod +x deploy/setup-droplet.sh && sudo ./deploy/setup-droplet.sh
# =========================================================================

set -e

echo "========================================================="
echo "  Setting up Lok Samadhan Backend on DigitalOcean Droplet"
echo "========================================================="

# 1. Update system packages
apt-get update && apt-get upgrade -y
apt-get install -y curl git ufw nginx

# 2. Configure Firewall (UFW)
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# 3. Install Node.js 22 LTS
if ! command -v node &> /dev/null; then
  echo "[1/4] Installing Node.js 22 LTS..."
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

# 4. Install PM2 process manager
echo "[2/4] Installing PM2..."
npm install -g pm2

# 5. Setup Project Dependencies
echo "[3/4] Installing backend dependencies..."
npm ci --only=production

# 6. Configure Nginx Reverse Proxy
echo "[4/4] Configuring Nginx reverse proxy..."
cat << 'EOF' > /etc/nginx/sites-available/lok-samadhan
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/lok-samadhan /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

# 7. Start App with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup systemd -u root --hp /root

echo "========================================================="
echo "✅ Lok Samadhan Backend is successfully running on Droplet!"
echo "   Public URL: http://$(curl -s ifconfig.me)"
echo "   Health Check: http://$(curl -s ifconfig.me)/api/health"
echo "========================================================="
