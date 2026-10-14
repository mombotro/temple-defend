#!/usr/bin/env bash
PORT=8080
echo "⚔️ Starting Temple Defend: Roma Invicta server on port $PORT..."
# Open browser in macOS
if command -v open > /dev/null; then
  open "http://localhost:$PORT" &
fi
python3 -m http.server $PORT
