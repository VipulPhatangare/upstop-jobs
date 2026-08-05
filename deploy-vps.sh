#!/bin/bash
# -------------------------------------------------------------------
# Unstop Jobs & Internships Platform - Automated VPS Deployment Script
# Tuned for VPS: 2 vCPU Cores | 8 GB RAM | 100 GB NVMe | 8 TB Bandwidth
# -------------------------------------------------------------------

set -e

echo "🚀 Starting Automated Deployment for 2 vCPU / 8 GB RAM VPS..."

# 1. Update System Packages
sudo apt update && sudo apt upgrade -y

# 2. Install Essential Tools
sudo apt install -y curl git build-essential nginx

# 3. Install Node.js 22 LTS
if ! command -v node &> /dev/null; then
  echo "📦 Installing Node.js 22 LTS..."
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt install -y nodejs
fi

# 4. Install PM2 Process Manager globally
sudo npm install -g pm2

# 5. Install & Start MongoDB 7.0 (if not already installed)
if ! command -v mongod &> /dev/null; then
  echo "🍃 Installing MongoDB 7.0 Community Edition..."
  sudo apt install -y gnupg curl
  curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
  echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
  sudo apt update
  sudo apt install -y mongodb-org
  sudo systemctl enable mongod
  sudo systemctl start mongod
fi

# 6. Install Project Dependencies & Build Frontend
echo "⚡ Installing Backend Dependencies..."
cd backend && npm install && cd ..

echo "⚡ Installing Frontend Dependencies & Building Production Bundle..."
cd frontend && npm install && npm run build && cd ..

# 7. Start Backend API Server with PM2 Process Manager
echo "🚀 Launching Backend API Server under PM2 Manager..."
pm2 start ecosystem.config.cjs
pm2 save
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME

# 8. Configure Nginx Reverse Proxy & Static Frontend Server
echo "🌐 Configuring Nginx Web Server..."
sudo tee /etc/nginx/sites-available/unstop > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;

    # Serve Production React Frontend
    location / {
        root /var/www/unstop/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Proxy Express Backend API Requests
    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

sudo mkdir -p /var/www/unstop
sudo cp -r . /var/www/unstop/
sudo ln -sf /etc/nginx/sites-available/unstop /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

echo "🎉 DEPLOYMENT COMPLETE! Your platform is live on your VPS IP address!"
