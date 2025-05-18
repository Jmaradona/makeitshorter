#!/bin/bash

# Exit on any error
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=====================================================${NC}"
echo -e "${BLUE}      Deploying Make it Shorter!!! to Render.com      ${NC}"
echo -e "${BLUE}=====================================================${NC}"

# Check if Render CLI is installed
if ! command -v render &> /dev/null; then
    echo -e "${RED}Error: Render CLI is not installed.${NC}"
    echo -e "${YELLOW}Please install it using: npm install -g @render/cli${NC}"
    exit 1
fi

# Check if Blueprint exists
if [ ! -f "render.yaml" ]; then
    echo -e "${RED}Error: render.yaml blueprint not found.${NC}"
    exit 1
fi

# Check if user is authenticated with Render
render whoami &> /dev/null
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}You need to login to Render:${NC}"
    render login
fi

echo -e "${GREEN}Deploying using render.yaml blueprint...${NC}"

# Deploy using the blueprint
render blueprint apply

echo -e "${GREEN}Blueprint applied successfully.${NC}"
echo -e "${YELLOW}Note: Complete the environment variable setup in the Render dashboard.${NC}"

echo -e "${BLUE}=====================================================${NC}"
echo -e "${GREEN}Deployment initiated successfully!${NC}"
echo -e "${BLUE}=====================================================${NC}"