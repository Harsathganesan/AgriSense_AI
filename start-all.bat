@echo off
title AgriSense AI - Full-Stack Launcher
echo ===================================================
echo   AgriSense AI - Launching Platform
echo ===================================================
echo.
echo Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "AgriSense AI - Backend" cmd /k "cd /d %~dp0backend && .\venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo Starting Vite React Frontend on http://localhost:5173 ...
start "AgriSense AI - Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Both services are starting in separate windows.
echo Frontend will be live at: http://localhost:5173
echo Backend docs will be at:  http://127.0.0.1:8000/docs
echo.
pause

