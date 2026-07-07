#!/bin/bash
# GCP Compute Engine setup script
# Run as root on a fresh Ubuntu 22.04 VM:
#   curl -sL https://raw.githubusercontent.com/YOUR_REPO/main/deploy/setup.sh | bash
# Or upload and run: bash setup.sh

set -e

APP_USER="festfind"
APP_DIR="/opt/festfind"
DOMAIN="${1:-}"  # Optional: pass domain as argument

echo "=== FestFind Server Setup ==="

# 1. System deps
apt-get update -qq
apt-get install -y -qq python3 python3-pip python3-venv nodejs npm sqlite3 nginx certbot python3-certbot-nginx ufw

# 2. Create app user
if ! id "$APP_USER" &>/dev/null; then
    useradd -m -s /bin/bash "$APP_USER"
fi

# 3. Clone or copy app
if [ ! -d "$APP_DIR" ]; then
    mkdir -p "$APP_DIR"
fi

# If running from repo dir, copy files (skip if already at target)
if [ "$(realpath .)" != "$(realpath $APP_DIR)" ] && [ -f "./backend/app/main.py" ]; then
    cp -r . "$APP_DIR/"
elif [ ! -f "$APP_DIR/backend/app/main.py" ]; then
    echo "Clone your repo to $APP_DIR first, then re-run this script."
    exit 1
fi

cd "$APP_DIR"

# 4. Build frontend
cd frontend
npm install
npm run build
cp -r dist ../backend/static
cd ..

# 5. Python deps
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..

# 6. Generate JWT secret
JWT_SECRET=$(python3 -c "import os; print(os.urandom(32).hex())")

# 7. Create .env
cat > backend/.env << EOF
JWT_SECRET=$JWT_SECRET
SERVER_HOST=${DOMAIN:-$(curl -s ifconfig.me)}
DATABASE_URL=sqlite:///./collegefest.db
EOF

echo ""
echo "=== Secrets ==="
echo "JWT_SECRET: $JWT_SECRET"
echo "Save this! It is in $APP_DIR/backend/.env"
echo ""

# 8. Systemd service
cat > /etc/systemd/system/festfind.service << 'EOF'
[Unit]
Description=FestFind Web App
After=network.target

[Service]
Type=simple
User=festfind
WorkingDirectory=/opt/festfind/backend
Environment=PATH=/opt/festfind/backend/venv/bin:/usr/bin
ExecStart=/opt/festfind/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable festfind
systemctl start festfind

# 9. Nginx reverse proxy
cat > /etc/nginx/sites-available/festfind << EOF
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};

    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 10s;
    }
}
EOF

ln -sf /etc/nginx/sites-available/festfind /etc/nginx/sites-enabled/festfind
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# 10. Firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# 11. SSL (if domain provided)
if [ -n "$DOMAIN" ]; then
    certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos -m "admin@$DOMAIN" || true
fi

# 12. Log rotation
cat > /etc/logrotate.d/festfind << 'EOF'
/opt/festfind/backend/*.log {
    daily
    rotate 7
    compress
    missingok
    notifempty
}
EOF

echo ""
echo "=== Setup Complete ==="
IP=$(curl -s ifconfig.me)
echo "App running at: http://$IP"
echo "Health check:   http://$IP/api/health"
echo "Admin panel:    http://$IP/hq-9f3k"
echo ""
echo "Scraper runs automatically every 6 hours (in-background thread)."
echo ""
echo "Service management:"
echo "  systemctl status festfind"
echo "  systemctl restart festfind"
echo "  journalctl -u festfind -f"
echo ""
echo "To check scraper status: curl http://$IP/api/admin/scrape-status"
