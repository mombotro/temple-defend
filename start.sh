#!/usr/bin/env bash
PORT=8080
echo "⚔️ Starting Temple Defend: Roma Invicta server on port $PORT..."
# Open browser in Linux or macOS
if command -v xdg-open > /dev/null; then
  xdg-open "http://localhost:$PORT" &
elif command -v open > /dev/null; then
  open "http://localhost:$PORT" &
fi
python3 -m http.server $PORT
