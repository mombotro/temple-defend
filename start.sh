#!/usr/bin/env bash
PORT=8080
echo "⚔️ Starting Temple Defend: Roma Invicta server on port $PORT..."

# Free port 8080 if previously left running
fuser -k $PORT/tcp 2>/dev/null || true

# Generate fresh timestamp to force browser to reload fresh assets (no stale cache)
TIMESTAMP=$(date +%s)
URL="http://localhost:$PORT/?v=$TIMESTAMP"

# Open browser in Linux or macOS after short delay so server has bound port
(sleep 0.5 && {
  if command -v xdg-open > /dev/null; then
    xdg-open "$URL" >/dev/null 2>&1
  elif command -v open > /dev/null; then
    open "$URL" >/dev/null 2>&1
  fi
}) &

# Run custom no-cache HTTP server so browser NEVER serves stale cached scripts
python3 -c "
import http.server, socketserver

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(('', $PORT), NoCacheHandler) as httpd:
    httpd.serve_forever()
"
