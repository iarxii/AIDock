@echo off
setlocal enabledelayedexpansion
title AIDock — Docker Build & Orchestration Manager
cd /d "%~dp0"

:menu
cls
echo ======================================================================
echo    AIDOCK ORCHESTRATOR — DOCKER COMPOSE MANAGER
echo ======================================================================
echo    Working Directory: %CD%
echo ----------------------------------------------------------------------
echo.
echo    [1] Rebuild Frontend Client (Fast: docker compose up -d --build client)
echo    [2] Clean Rebuild Frontend Client (No-Cache)
echo    [3] Rebuild Backend API (FastAPI service only)
echo    [4] Rebuild ENTIRE Stack (Client, Backend, DB)
echo    [5] Restart All Services (No rebuild)
echo    [6] Check Status of Containers (docker compose ps)
echo    [7] Stream Live Container Logs (docker compose logs -f)
echo    [8] Stop & Down All Containers (docker compose down)
echo    [9] Prune Dangling Images (Soft Prune)
echo    [0] Exit
echo.
echo ======================================================================
set /p choice="Select an option [0-9] and press Enter: "

if "%choice%"=="1" goto rebuild_client
if "%choice%"=="2" goto rebuild_client_clean
if "%choice%"=="3" goto rebuild_backend
if "%choice%"=="4" goto rebuild_all
if "%choice%"=="5" goto restart_all
if "%choice%"=="6" goto status
if "%choice%"=="7" goto stream_logs
if "%choice%"=="8" goto down_all
if "%choice%"=="9" goto prune
if "%choice%"=="0" goto exit
goto menu

:rebuild_client
cls
echo [AIDock] Rebuilding frontend client container...
echo Command: docker compose up -d --build client
echo ----------------------------------------------------------------------
docker compose up -d --build client
echo.
echo [AIDock] Frontend updated! Available at http://localhost:3000/
echo.
pause
goto menu

:rebuild_client_clean
cls
echo [AIDock] Performing clean rebuild (no-cache) for frontend client...
echo Command: docker compose build --no-cache client ^&^& docker compose up -d client
echo ----------------------------------------------------------------------
docker compose build --no-cache client
docker compose up -d client
echo.
echo [AIDock] Clean rebuild complete! Available at http://localhost:3000/
echo.
pause
goto menu

:rebuild_backend
cls
echo [AIDock] Rebuilding backend container...
echo Command: docker compose up -d --build backend
echo ----------------------------------------------------------------------
docker compose up -d --build backend
echo.
echo [AIDock] Backend rebuilt! Available at http://localhost:8080/
echo.
pause
goto menu

:rebuild_all
cls
echo [AIDock] Rebuilding all containers (Client, Backend, DB)...
echo Command: docker compose up -d --build
echo ----------------------------------------------------------------------
docker compose up -d --build
echo.
echo [AIDock] Entire stack rebuilt and running!
echo.
pause
goto menu

:restart_all
cls
echo [AIDock] Restarting all services...
echo Command: docker compose restart
echo ----------------------------------------------------------------------
docker compose restart
echo.
echo [AIDock] Services restarted.
echo.
pause
goto menu

:status
cls
echo [AIDock] Current Container Status:
echo ----------------------------------------------------------------------
docker compose ps
echo.
pause
goto menu

:stream_logs
cls
echo [AIDock] Streaming container logs (Press Ctrl+C to return to menu)...
echo ----------------------------------------------------------------------
docker compose logs -f
goto menu

:down_all
cls
echo [AIDock] Stopping and removing all containers and networks...
echo Command: docker compose down
echo ----------------------------------------------------------------------
docker compose down
echo.
echo [AIDock] Stack stopped.
echo.
pause
goto menu

:prune
cls
echo [AIDock] Running soft prune for unused Docker images...
echo ----------------------------------------------------------------------
call docker_prune.bat soft
echo.
pause
goto menu

:exit
echo [AIDock] Exiting Docker Manager. Goodbye!
exit /b 0
