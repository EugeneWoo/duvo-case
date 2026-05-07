#!/bin/bash

echo "Starting Duvo Agent (backend + frontend)..."
echo ""

# Start backend in background
echo "Starting backend on http://localhost:3000"
cd backend
npm run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 2

# Start frontend
echo "Starting frontend on http://localhost:5173"
cd ../frontend
npm run dev

# Kill backend on frontend exit
kill $BACKEND_PID 2>/dev/null
