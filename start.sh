#!/bin/bash

# Seat Booking Application Startup Script
# This script starts both the backend and frontend servers

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Seat Booking Application Startup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Get WSL IP address
WSL_IP=$(hostname -I | awk '{print $1}')
echo -e "${GREEN}WSL IP Address: ${WSL_IP}${NC}"
echo ""

# Start Backend
echo -e "${GREEN}Starting Backend Server...${NC}"
cd /home/bboussiba/workspace/bentest/backend
python3 app.py &
BACKEND_PID=$!
echo -e "${GREEN}Backend started with PID: ${BACKEND_PID}${NC}"
echo -e "${GREEN}Backend URL: http://${WSL_IP}:5000${NC}"
echo ""

# Wait for backend to initialize
sleep 3

# Start Frontend
echo -e "${GREEN}Starting Frontend Server...${NC}"
cd /home/bboussiba/workspace/bentest/frontend
npm start &
FRONTEND_PID=$!
echo -e "${GREEN}Frontend started with PID: ${FRONTEND_PID}${NC}"
echo -e "${GREEN}Frontend URL: http://${WSL_IP}:3000${NC}"
echo ""

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Application Started Successfully!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}Access the application from Windows at:${NC}"
echo -e "${BLUE}http://${WSL_IP}:3000${NC}"
echo ""
echo -e "${RED}To stop the servers, press Ctrl+C or run:${NC}"
echo -e "${RED}kill ${BACKEND_PID} ${FRONTEND_PID}${NC}"
echo ""

# Save PIDs to file for easy shutdown
echo "${BACKEND_PID}" > /home/bboussiba/workspace/bentest/.backend.pid
echo "${FRONTEND_PID}" > /home/bboussiba/workspace/bentest/.frontend.pid

# Wait for both processes
wait
