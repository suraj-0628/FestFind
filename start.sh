#!/bin/bash
set -e

echo "Starting FestFind..."

# Kill any stale processes on our ports
kill $(lsof -ti:8000 2>/dev/null) 2>/dev/null || true
kill $(lsof -ti:5173 2>/dev/null) 2>/dev/null || true
sleep 1

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Backend API
cd "$SCRIPT_DIR/backend"
export PATH="$HOME/.local/bin:$PATH"
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 &
echo "Backend starting on :8000..."

# Frontend
cd "$SCRIPT_DIR/frontend"
node -e "
const { createServer } = require('vite');
createServer({ server: { host: '0.0.0.0', port: 5173 } })
  .then(s => { s.listen(); console.log('Frontend starting on :5173...'); })
  .catch(e => { console.error(e); process.exit(1); });
" &

sleep 3
echo ""
echo "=================================="
echo "  Frontend: http://127.0.0.1:5173/"
echo "  API:      http://127.0.0.1:8000/"
echo "=================================="
