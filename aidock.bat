@echo off
setlocal
cd /d "%~dp0"

:: Self-healing: Check if venv is healthy
IF EXIST ".venv" (
    IF NOT EXIST ".venv\Scripts\python.exe" (
        echo [AIDock] Detected corrupted virtual environment. Healing...
        rmdir /s /q .venv
    )
)

IF NOT EXIST ".venv" (
    echo [AIDock] Creating isolated virtual environment...
    python -m venv .venv
)

:: Ensure dependencies are present
.venv\Scripts\python.exe -c "import questionary, rich, click, dotenv" >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo [AIDock] Syncing CLI dependencies...
    .venv\Scripts\python.exe -m pip install -q -r requirements.txt
)

call .venv\Scripts\activate.bat
python cli\aidock.py %*

