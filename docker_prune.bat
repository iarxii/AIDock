@echo off
setlocal

set ARG=%1

if "%ARG%"=="soft" (
    echo [WARNING] SOFT PRUNE: This will remove all dangling Docker images (images not tagged and not used by any container).
    set /p CONFIRM="Are you sure you want to proceed? (y/n): "
) else if "%ARG%"=="hard" (
    echo [WARNING] HARD PRUNE: This will remove ALL stopped containers, ALL networks not used by at least one container, ALL dangling images, and ALL unused images.
    set /p CONFIRM="Are you SURE you want to proceed? (y/n): "
) else (
    echo Usage: docker_prune.bat [soft^|hard]
    echo   soft : Remove dangling images only.
    echo   hard : Remove all unused containers, networks, and images.
    goto :eof
)

if /i "%CONFIRM%"=="y" (
    if "%ARG%"=="soft" (
        docker image prune -f
        echo [AIDock] Soft prune complete.
    ) else (
        docker system prune -a -f
        echo [AIDock] Hard prune complete.
    )
) else (
    echo [AIDock] Prune aborted.
)
