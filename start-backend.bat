@echo off
title AgriSense AI - Backend Server
cd /d %~dp0backend
echo Starting AgriSense FastAPI Backend on http://127.0.0.1:8000 ...
.\venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
pause
