#!/usr/bin/env bash
# AIDock — Docker Build & Orchestration Manager (Linux / macOS / Git Bash)

set -e
cd "$(dirname "$0")"

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

while true; do
    clear
    echo -e "${CYAN}======================================================================${NC}"
    echo -e "${CYAN}   AIDOCK ORCHESTRATOR — DOCKER COMPOSE MANAGER${NC}"
    echo -e "${CYAN}======================================================================${NC}"
    echo -e "   Working Directory: $(pwd)"
    echo -e "----------------------------------------------------------------------"
    echo ""
    echo -e "   ${GREEN}[1]${NC} Rebuild Frontend Client (Fast: docker compose up -d --build client)"
    echo -e "   ${GREEN}[2]${NC} Clean Rebuild Frontend Client (No-Cache)"
    echo -e "   ${GREEN}[3]${NC} Rebuild Backend API (FastAPI service only)"
    echo -e "   ${GREEN}[4]${NC} Rebuild ENTIRE Stack (Client, Backend, DB)"
    echo -e "   ${GREEN}[5]${NC} Restart All Services (No rebuild)"
    echo -e "   ${GREEN}[6]${NC} Check Status of Containers (docker compose ps)"
    echo -e "   ${GREEN}[7]${NC} Stream Live Container Logs (docker compose logs -f)"
    echo -e "   ${YELLOW}[8]${NC} Stop & Down All Containers (docker compose down)"
    echo -e "   ${YELLOW}[9]${NC} Prune Dangling Images (Soft Prune)"
    echo -e "   ${RED}[0]${NC} Exit"
    echo ""
    echo -e "${CYAN}======================================================================${NC}"
    read -rp "Select an option [0-9] and press Enter: " choice

    case "$choice" in
        1)
            clear
            echo -e "${CYAN}[AIDock] Rebuilding frontend client container...${NC}"
            echo "Command: docker compose up -d --build client"
            echo "----------------------------------------------------------------------"
            docker compose up -d --build client
            echo -e "\n${GREEN}[AIDock] Frontend updated! Available at http://localhost:3000/${NC}\n"
            read -rp "Press Enter to return to menu..."
            ;;
        2)
            clear
            echo -e "${CYAN}[AIDock] Performing clean rebuild (no-cache) for frontend client...${NC}"
            echo "Command: docker compose build --no-cache client && docker compose up -d client"
            echo "----------------------------------------------------------------------"
            docker compose build --no-cache client
            docker compose up -d client
            echo -e "\n${GREEN}[AIDock] Clean rebuild complete! Available at http://localhost:3000/${NC}\n"
            read -rp "Press Enter to return to menu..."
            ;;
        3)
            clear
            echo -e "${CYAN}[AIDock] Rebuilding backend container...${NC}"
            echo "Command: docker compose up -d --build backend"
            echo "----------------------------------------------------------------------"
            docker compose up -d --build backend
            echo -e "\n${GREEN}[AIDock] Backend rebuilt! Available at http://localhost:8080/${NC}\n"
            read -rp "Press Enter to return to menu..."
            ;;
        4)
            clear
            echo -e "${CYAN}[AIDock] Rebuilding all containers (Client, Backend, DB)...${NC}"
            echo "Command: docker compose up -d --build"
            echo "----------------------------------------------------------------------"
            docker compose up -d --build
            echo -e "\n${GREEN}[AIDock] Entire stack rebuilt and running!${NC}\n"
            read -rp "Press Enter to return to menu..."
            ;;
        5)
            clear
            echo -e "${CYAN}[AIDock] Restarting all services...${NC}"
            echo "Command: docker compose restart"
            echo "----------------------------------------------------------------------"
            docker compose restart
            echo -e "\n${GREEN}[AIDock] Services restarted.${NC}\n"
            read -rp "Press Enter to return to menu..."
            ;;
        6)
            clear
            echo -e "${CYAN}[AIDock] Current Container Status:${NC}"
            echo "----------------------------------------------------------------------"
            docker compose ps
            echo ""
            read -rp "Press Enter to return to menu..."
            ;;
        7)
            clear
            echo -e "${CYAN}[AIDock] Streaming container logs (Press Ctrl+C to return to menu)...${NC}"
            echo "----------------------------------------------------------------------"
            docker compose logs -f || true
            ;;
        8)
            clear
            echo -e "${YELLOW}[AIDock] Stopping and removing all containers and networks...${NC}"
            echo "Command: docker compose down"
            echo "----------------------------------------------------------------------"
            docker compose down
            echo -e "\n${YELLOW}[AIDock] Stack stopped.${NC}\n"
            read -rp "Press Enter to return to menu..."
            ;;
        9)
            clear
            echo -e "${YELLOW}[AIDock] Running soft prune for unused Docker images...${NC}"
            echo "----------------------------------------------------------------------"
            if [ -f "./docker_prune.sh" ]; then
                bash ./docker_prune.sh soft
            else
                docker image prune -f
            fi
            echo ""
            read -rp "Press Enter to return to menu..."
            ;;
        0)
            echo -e "${CYAN}[AIDock] Exiting Docker Manager. Goodbye!${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid selection. Please choose an option from 0 to 9.${NC}"
            sleep 1
            ;;
    esac
done
