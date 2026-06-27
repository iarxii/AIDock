#!/bin/bash
cd "$(dirname "$0")"

# Self-healing: Check if venv is healthy
if [ -d ".venv" ]; then
    if [ ! -f ".venv/bin/python" ]; then
        echo "[AIDock] Detected corrupted virtual environment. Healing..."
        rm -rf .venv
    fi
fi

if [ ! -d ".venv" ]; then
    echo "[AIDock] Creating isolated virtual environment..."
    python3 -m venv .venv
fi

# Ensure dependencies are present
.venv/bin/python -c "import questionary, rich, click, dotenv" >/dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "[AIDock] Syncing CLI dependencies..."
    .venv/bin/python -m pip install -q -r requirements.txt
fi

source .venv/bin/activate
python cli/aidock.py "$@"
