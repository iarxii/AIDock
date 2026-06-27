#!/bin/bash

ARG=$1

if [ "$ARG" = "soft" ]; then
    echo "[WARNING] SOFT PRUNE: This will remove all dangling Docker images (images not tagged and not used by any container)."
    read -p "Are you sure you want to proceed? (y/n): " confirm
elif [ "$ARG" = "hard" ]; then
    echo "[WARNING] HARD PRUNE: This will remove ALL stopped containers, ALL networks not used by at least one container, ALL dangling images, and ALL unused images."
    read -p "Are you SURE you want to proceed? (y/n): " confirm
else
    echo "Usage: ./docker_prune.sh [soft|hard]"
    echo "  soft : Remove dangling images only."
    echo "  hard : Remove all unused containers, networks, and images."
    exit 1
fi

if [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
    if [ "$ARG" = "soft" ]; then
        docker image prune -f
        echo "[AIDock] Soft prune complete."
    else
        docker system prune -a -f
        echo "[AIDock] Hard prune complete."
    fi
else
    echo "[AIDock] Prune aborted."
fi
