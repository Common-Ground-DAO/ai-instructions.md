#!/bin/bash

# Function to check if a port is in use
is_port_in_use() {
    lsof -i ":$1" >/dev/null 2>&1
    return $?
}

# Function to kill process using a port
kill_port() {
    echo "Killing process on port $1..."
    lsof -ti ":$1" | xargs kill -9 2>/dev/null
}

# Check and clean ports if needed
if is_port_in_use 3000; then
    echo "Port 3000 is in use. Cleaning up..."
    kill_port 3000
    sleep 1
fi

if is_port_in_use 8000; then
    echo "Port 8000 is in use. Cleaning up..."
    kill_port 8000
    sleep 1
fi

# Start the API server in the background
cd api && node server.js &
API_PID=$!

# Start Python server from the ai-instructions.md directory
cd .. && cd ai-instructions.md && python3 -m http.server 8000 &
PYTHON_PID=$!

# Setup cleanup on script exit
cleanup() {
    echo "Shutting down servers..."
    kill $API_PID 2>/dev/null
    kill $PYTHON_PID 2>/dev/null
    exit
}

trap cleanup INT

# Wait for servers to start
sleep 2

# Check if servers started successfully
if ! is_port_in_use 3000; then
    echo "❌ Failed to start API server on port 3000"
    cleanup
    exit 1
fi

if ! is_port_in_use 8000; then
    echo "❌ Failed to start frontend server on port 8000"
    cleanup
    exit 1
fi

echo "🚀 Development servers started!"
echo "📡 API running on http://localhost:3000"
echo "🌍 Frontend running on http://localhost:8000"
echo "Press Ctrl+C to stop both servers"

# Wait forever
wait