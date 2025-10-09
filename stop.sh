#!/bin/bash

# Seat Booking Application Stop Script
# This script stops both the backend and frontend servers

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${RED}Stopping Seat Booking Application...${NC}"
echo ""

# Read PIDs from files
BACKEND_PID_FILE="/home/bboussiba/workspace/bentest/.backend.pid"
FRONTEND_PID_FILE="/home/bboussiba/workspace/bentest/.frontend.pid"

# Stop backend
if [ -f "$BACKEND_PID_FILE" ]; then
    BACKEND_PID=$(cat "$BACKEND_PID_FILE")
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo -e "${RED}Stopping Backend (PID: ${BACKEND_PID})...${NC}"
        kill $BACKEND_PID
        echo -e "${GREEN}Backend stopped.${NC}"
    else
        echo -e "${RED}Backend process not found.${NC}"
    fi
    rm "$BACKEND_PID_FILE"
fi

# Stop frontend
if [ -f "$FRONTEND_PID_FILE" ]; then
    FRONTEND_PID=$(cat "$FRONTEND_PID_FILE")
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo -e "${RED}Stopping Frontend (PID: ${FRONTEND_PID})...${NC}"
        kill $FRONTEND_PID
        echo -e "${GREEN}Frontend stopped.${NC}"
    else
        echo -e "${RED}Frontend process not found.${NC}"
    fi
    rm "$FRONTEND_PID_FILE"
fi

# Also kill any remaining processes on ports 5000 and 3000
echo ""
echo -e "${RED}Cleaning up any remaining processes...${NC}"
pkill -f "python3 app.py"
pkill -f "react-scripts start"

echo ""
echo -e "${GREEN}Application stopped successfully.${NC}"
